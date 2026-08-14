/**
 * Bill Vyom — Phase 10 Global Tax Engine & Compliance Foundation
 * Authoritative, stateless/cached, multi-jurisdiction, decimal-exact tax determination & calculation engine.
 * STRICTLY ENFORCES ABSOLUTE TAX DATA TRUTH:
 * - NO fake rates, NO fake calculations, NO silent zero-tax fallbacks.
 * - Explicit error states if tax configuration is missing.
 */

import crypto from 'crypto';
import { Decimal } from '../../domain/decimal';
import {
  TaxContext,
  TaxCalculationResult,
  TaxLineResult,
  TaxDocumentSnapshot,
  TaxErrorCode,
  TaxJurisdiction,
  TaxAuthority,
  TaxRegime,
  TaxCodeMaster,
  TaxRateMaster,
  TaxRuleMaster,
  TaxExemptionRecord,
  TaxOverrideRecord,
  GlobalTaxRegistration,
} from '../../domain/types';
import { db } from '../db';

export interface TaxEngineCacheOptions {
  enableCache?: boolean;
}

export class GlobalTaxEngine {
  private static instance: GlobalTaxEngine;
  private ruleCache: Map<string, { rules: TaxRuleMaster[]; timestamp: number }> = new Map();
  private cacheTtlMs = 60000; // 1 minute TTL

  private constructor() {}

  public static getInstance(): GlobalTaxEngine {
    if (!GlobalTaxEngine.instance) {
      GlobalTaxEngine.instance = new GlobalTaxEngine();
    }
    return GlobalTaxEngine.instance;
  }

  public clearCache(): void {
    this.ruleCache.clear();
  }

  /**
   * Authoritative Tax Determination & Calculation Entrypoint
   */
  public calculateTax(context: TaxContext, options: TaxEngineCacheOptions = { enableCache: true }): TaxCalculationResult {
    const {
      tenant_id,
      legal_entity_id,
      transaction_date,
      currency_code,
      transaction_type,
      seller_country_code,
      buyer_country_code,
      lines,
    } = context;

    const traceRulesMatched: Array<{
      line_id: string;
      rule_id: string;
      rule_code: string;
      rule_version: number;
      tax_code: string;
      rate: string;
      reason: string;
    }> = [];

    // 1. Basic validation of tenant and context
    if (!tenant_id || !legal_entity_id || !transaction_date || !currency_code || !lines) {
      return {
        success: false,
        error_code: 'TAX_CONFIGURATION_MISSING',
        error_message: 'Tax Context is incomplete (missing tenant, legal entity, transaction date or lines).',
        currency_code: currency_code || 'USD',
        total_taxable_base: '0.00',
        total_tax_amount: '0.00',
        total_output_tax: '0.00',
        total_input_tax: '0.00',
        total_reverse_charge_tax: '0.00',
        total_withholding_tax: '0.00',
        lines: [],
        tax_breakdown_by_code: {},
        determination_trace: {
          seller_jurisdiction: seller_country_code || 'UNRESOLVED',
          buyer_jurisdiction: buyer_country_code || 'UNRESOLVED',
          place_of_supply: 'UNRESOLVED',
          rules_matched: [],
          timestamp: new Date().toISOString(),
        },
      };
    }

    // 2. Resolve Country configurations
    const sellerCountry = db.getTaxCountryConfig(seller_country_code);
    const buyerCountry = db.getTaxCountryConfig(buyer_country_code);

    if (!sellerCountry && !buyerCountry) {
      return {
        success: false,
        error_code: 'TAX_JURISDICTION_UNRESOLVED',
        error_message: `Neither seller country (${seller_country_code}) nor buyer country (${buyer_country_code}) is configured in the Global Tax Master.`,
        currency_code,
        total_taxable_base: '0.00',
        total_tax_amount: '0.00',
        total_output_tax: '0.00',
        total_input_tax: '0.00',
        total_reverse_charge_tax: '0.00',
        total_withholding_tax: '0.00',
        lines: [],
        tax_breakdown_by_code: {},
        determination_trace: {
          seller_jurisdiction: seller_country_code,
          buyer_jurisdiction: buyer_country_code,
          place_of_supply: 'UNRESOLVED',
          rules_matched: [],
          timestamp: new Date().toISOString(),
        },
      };
    }

    // 3. Resolve Active Jurisdictions
    const jurisdictions = db.getTaxJurisdictionsByTenant(tenant_id);
    const sellerJurisdiction = jurisdictions.find(
      (j) =>
        (context.seller_jurisdiction_code && j.jurisdiction_code === context.seller_jurisdiction_code) ||
        j.country_code === seller_country_code
    );
    const buyerJurisdiction = jurisdictions.find(
      (j) =>
        (context.buyer_jurisdiction_code && j.jurisdiction_code === context.buyer_jurisdiction_code) ||
        j.country_code === buyer_country_code
    );

    // 4. Fetch Active Approved Rules for Tenant
    const activeRules = this.getActiveApprovedRules(tenant_id, transaction_date, options.enableCache);

    if (activeRules.length === 0) {
      return {
        success: false,
        error_code: 'TAX_RULE_NOT_FOUND',
        error_message: `No approved, active tax rules found for tenant ${tenant_id} on transaction date ${transaction_date}.`,
        currency_code,
        total_taxable_base: '0.00',
        total_tax_amount: '0.00',
        total_output_tax: '0.00',
        total_input_tax: '0.00',
        total_reverse_charge_tax: '0.00',
        total_withholding_tax: '0.00',
        lines: [],
        tax_breakdown_by_code: {},
        determination_trace: {
          seller_jurisdiction: sellerJurisdiction?.jurisdiction_code || seller_country_code,
          buyer_jurisdiction: buyerJurisdiction?.jurisdiction_code || buyer_country_code,
          place_of_supply: 'UNRESOLVED',
          rules_matched: [],
          timestamp: new Date().toISOString(),
        },
      };
    }

    const calculatedLines: TaxLineResult[] = [];
    const taxBreakdownMap: Record<string, { code: string; name: string; rate: string; taxable_base: Decimal; tax_amount: Decimal; jurisdiction: string }> = {};

    let totalTaxableBase = Decimal.zero(4);
    let totalTaxAmount = Decimal.zero(4);
    let totalOutputTax = Decimal.zero(4);
    let totalInputTax = Decimal.zero(4);
    let totalReverseCharge = Decimal.zero(4);
    let totalWithholding = Decimal.zero(4);

    // 5. Line by Line Determination and Calculation
    for (const line of lines) {
      const lineQty = new Decimal(line.quantity || 1, 4);
      const unitPrice = new Decimal(line.unit_price || '0', 4);
      const discount = new Decimal(line.discount_amount || '0', 4);
      
      // Calculate Net Taxable Line Base
      let netLineBase = new Decimal(line.line_amount || '0', 4);
      if (netLineBase.isZero()) {
        netLineBase = unitPrice.mul(lineQty).sub(discount);
        if (netLineBase.isNegative()) {
          netLineBase = Decimal.zero(4);
        }
      }

      // Check Exemption status
      let isExempt = false;
      let exemptionReason: string | null = null;

      if (line.is_exempt || line.exemption_certificate || context.customer_id) {
        const exemption = this.findValidExemption(tenant_id, {
          customer_id: context.customer_id,
          vendor_id: context.vendor_id,
          product_id: line.product_id,
          jurisdiction_id: buyerJurisdiction?.id || sellerJurisdiction?.id,
          certificate_number: line.exemption_certificate,
          date: transaction_date,
        });

        if (exemption) {
          isExempt = true;
          exemptionReason = `Exemption Certificate: ${exemption.certificate_number} (${exemption.exemption_reason})`;
        } else if (line.is_exempt && line.exemption_certificate) {
          // If exemption was claimed with an invalid certificate, fail explicitly!
          return {
            success: false,
            error_code: 'TAX_EXEMPTION_INVALID',
            error_message: `Exemption certificate '${line.exemption_certificate}' is invalid, expired, or unapproved for line ${line.line_id}.`,
            currency_code,
            total_taxable_base: '0.00',
            total_tax_amount: '0.00',
            total_output_tax: '0.00',
            total_input_tax: '0.00',
            total_reverse_charge_tax: '0.00',
            total_withholding_tax: '0.00',
            lines: [],
            tax_breakdown_by_code: {},
            determination_trace: {
              seller_jurisdiction: sellerJurisdiction?.jurisdiction_code || seller_country_code,
              buyer_jurisdiction: buyerJurisdiction?.jurisdiction_code || buyer_country_code,
              place_of_supply: 'EXEMPTION_CHECK_FAILED',
              rules_matched: [],
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      // If line has explicit tax_code_id override
      let matchedRules: TaxRuleMaster[] = [];
      if (line.tax_code_id) {
        const directCode = db.taxCodes.get(line.tax_code_id);
        if (directCode) {
          // Find or synthesize direct matching
          matchedRules = activeRules.filter((r) => r.tax_code_ids.includes(directCode.id));
        }
      }

      if (matchedRules.length === 0) {
        // Run Rule Determination Matrix
        matchedRules = this.determineApplicableRules(activeRules, {
          context,
          line,
          sellerJurisdiction,
          buyerJurisdiction,
          amount: netLineBase,
        });
      }

      if (matchedRules.length === 0 && !isExempt) {
        // STRICT ABSOLUTE TAX TRUTH RULE: Never fallback silently to 0% tax!
        return {
          success: false,
          error_code: 'TAX_RULE_NOT_FOUND',
          error_message: `No matching tax rule determined for line ${line.line_id} (SKU: ${line.sku || line.name || 'N/A'}, Category: ${line.tax_category_id || 'DEFAULT'}).`,
          currency_code,
          total_taxable_base: '0.00',
          total_tax_amount: '0.00',
          total_output_tax: '0.00',
          total_input_tax: '0.00',
          total_reverse_charge_tax: '0.00',
          total_withholding_tax: '0.00',
          lines: [],
          tax_breakdown_by_code: {},
          determination_trace: {
            seller_jurisdiction: sellerJurisdiction?.jurisdiction_code || seller_country_code,
            buyer_jurisdiction: buyerJurisdiction?.jurisdiction_code || buyer_country_code,
            place_of_supply: 'RULE_SEARCH_EXHAUSTED',
            rules_matched: traceRulesMatched,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // If exempt, produce zero-tax exempt line with audit trail
      if (isExempt) {
        const exemptLineResult: TaxLineResult = {
          line_id: line.line_id,
          tax_code_id: 'TAX-EXEMPT',
          tax_code: 'EXEMPT',
          tax_type: 'OUTPUT_TAX',
          regime_code: 'EXEMPT',
          jurisdiction_id: buyerJurisdiction?.id || sellerJurisdiction?.id || 'JUR-GLOBAL',
          jurisdiction_name: buyerJurisdiction?.jurisdiction_name || 'Exempt Jurisdiction',
          rate_type: 'PERCENTAGE',
          rate_value: '0.0000',
          rate_percentage_display: '0.00%',
          taxable_base: netLineBase.toString(2),
          tax_amount: '0.00',
          is_reverse_charge: false,
          is_withholding: false,
          is_exempt: true,
          exemption_reason: exemptionReason,
          rule_id: 'RULE-EXEMPT',
          rule_code: 'EXEMPT_RULE',
          rule_version: 1,
        };
        calculatedLines.push(exemptLineResult);
        totalTaxableBase = totalTaxableBase.add(netLineBase);
        traceRulesMatched.push({
          line_id: line.line_id,
          rule_id: 'EXEMPT',
          rule_code: 'TAX_EXEMPTION_APPLIED',
          rule_version: 1,
          tax_code: 'EXEMPT',
          rate: '0.00%',
          reason: exemptionReason || 'Exempt',
        });
        continue;
      }

      // 6. Calculate Tax for each matched tax code in the rule
      // Handle compound taxes in sequence of compound_priority
      let runningTaxableBase = netLineBase;
      let lineTotalTax = Decimal.zero(4);

      for (const rule of matchedRules) {
        for (const taxCodeId of rule.tax_code_ids) {
          const taxCode = db.taxCodes.get(taxCodeId);
          if (!taxCode) {
            return {
              success: false,
              error_code: 'TAX_RATE_UNAVAILABLE',
              error_message: `Tax code reference ${taxCodeId} not found in master records.`,
              currency_code,
              total_taxable_base: '0.00',
              total_tax_amount: '0.00',
              total_output_tax: '0.00',
              total_input_tax: '0.00',
              total_reverse_charge_tax: '0.00',
              total_withholding_tax: '0.00',
              lines: [],
              tax_breakdown_by_code: {},
              determination_trace: {
                seller_jurisdiction: sellerJurisdiction?.jurisdiction_code || seller_country_code,
                buyer_jurisdiction: buyerJurisdiction?.jurisdiction_code || buyer_country_code,
                place_of_supply: 'TAX_CODE_RESOLVE_FAILED',
                rules_matched: traceRulesMatched,
                timestamp: new Date().toISOString(),
              },
            };
          }

          const taxRate = this.findActiveRate(taxCode.id, transaction_date);
          if (!taxRate) {
            return {
              success: false,
              error_code: 'TAX_RATE_UNAVAILABLE',
              error_message: `Active tax rate unavailable for tax code ${taxCode.code} on date ${transaction_date}.`,
              currency_code,
              total_taxable_base: '0.00',
              total_tax_amount: '0.00',
              total_output_tax: '0.00',
              total_input_tax: '0.00',
              total_reverse_charge_tax: '0.00',
              total_withholding_tax: '0.00',
              lines: [],
              tax_breakdown_by_code: {},
              determination_trace: {
                seller_jurisdiction: sellerJurisdiction?.jurisdiction_code || seller_country_code,
                buyer_jurisdiction: buyerJurisdiction?.jurisdiction_code || buyer_country_code,
                place_of_supply: 'RATE_SEARCH_EXHAUSTED',
                rules_matched: traceRulesMatched,
                timestamp: new Date().toISOString(),
              },
            };
          }

          const regime = db.taxRegimes.get(taxCode.regime_id);
          const taxType = db.taxTypes.get(taxCode.tax_type_id);
          const jurisdiction = db.taxJurisdictions.get(taxCode.jurisdiction_id) || sellerJurisdiction || buyerJurisdiction;

          // Compute individual tax component
          let componentTax = Decimal.zero(4);
          let rateDisplay = '';

          if (taxRate.rate_type === 'PERCENTAGE') {
            const rawRate = new Decimal(taxRate.rate_value, 6);
            // rate_value e.g. "0.1800" (18%) or "18.00"
            const effectiveDecimalRate = rawRate.gt(1) ? rawRate.div('100.0000') : rawRate;
            componentTax = runningTaxableBase.mul(effectiveDecimalRate);
            rateDisplay = `${effectiveDecimalRate.mul('100').toString(2)}%`;
          } else if (taxRate.rate_type === 'FIXED_AMOUNT') {
            componentTax = new Decimal(taxRate.rate_value, 4);
            rateDisplay = `${taxRate.rate_value} (Fixed)`;
          } else if (taxRate.rate_type === 'PER_UNIT') {
            const perUnitRate = new Decimal(taxRate.rate_value, 4);
            componentTax = perUnitRate.mul(lineQty);
            rateDisplay = `${taxRate.rate_value} / unit`;
          } else {
            // Default percentage
            const effectiveDecimalRate = new Decimal(taxRate.rate_value, 6);
            componentTax = runningTaxableBase.mul(effectiveDecimalRate);
            rateDisplay = `${effectiveDecimalRate.mul('100').toString(2)}%`;
          }

          // Apply rounding policy (e.g. 2 decimals standard)
          const precision = taxRate.rounding_precision || 2;
          const roundedComponentTax = new Decimal(componentTax.toString(precision), 4);

          // If compound tax priority > 1, add to running base for subsequent rates
          if (taxRate.compound_priority && taxRate.compound_priority > 1) {
            runningTaxableBase = runningTaxableBase.add(roundedComponentTax);
          }

          const lineResult: TaxLineResult = {
            line_id: line.line_id,
            tax_code_id: taxCode.id,
            tax_code: taxCode.code,
            tax_type: taxType?.type_code || 'OUTPUT_TAX',
            regime_code: regime?.regime_code || 'VAT',
            jurisdiction_id: jurisdiction?.id || 'JUR_DEFAULT',
            jurisdiction_name: jurisdiction?.jurisdiction_name || 'Standard Jurisdiction',
            rate_type: taxRate.rate_type,
            rate_value: taxRate.rate_value,
            rate_percentage_display: rateDisplay,
            taxable_base: netLineBase.toString(2),
            tax_amount: roundedComponentTax.toString(2),
            is_reverse_charge: rule.is_reverse_charge,
            is_withholding: rule.is_withholding,
            is_exempt: false,
            rule_id: rule.id,
            rule_code: rule.rule_code,
            rule_version: rule.version,
            compound_priority: taxRate.compound_priority,
          };

          calculatedLines.push(lineResult);
          lineTotalTax = lineTotalTax.add(roundedComponentTax);

          // Track breakdown by tax code
          if (!taxBreakdownMap[taxCode.code]) {
            taxBreakdownMap[taxCode.code] = {
              code: taxCode.code,
              name: taxCode.name,
              rate: rateDisplay,
              taxable_base: netLineBase,
              tax_amount: roundedComponentTax,
              jurisdiction: jurisdiction?.jurisdiction_name || 'Standard',
            };
          } else {
            taxBreakdownMap[taxCode.code].taxable_base = taxBreakdownMap[taxCode.code].taxable_base.add(netLineBase);
            taxBreakdownMap[taxCode.code].tax_amount = taxBreakdownMap[taxCode.code].tax_amount.add(roundedComponentTax);
          }

          // Output / Input / Reverse Charge / Withholding categorisation
          if (rule.is_reverse_charge) {
            totalReverseCharge = totalReverseCharge.add(roundedComponentTax);
          } else if (rule.is_withholding) {
            totalWithholding = totalWithholding.add(roundedComponentTax);
          } else if (taxType?.type_code === 'INPUT_TAX' || transaction_type === 'PURCHASE') {
            totalInputTax = totalInputTax.add(roundedComponentTax);
          } else {
            totalOutputTax = totalOutputTax.add(roundedComponentTax);
          }

          traceRulesMatched.push({
            line_id: line.line_id,
            rule_id: rule.id,
            rule_code: rule.rule_code,
            rule_version: rule.version,
            tax_code: taxCode.code,
            rate: rateDisplay,
            reason: `Matched Rule ${rule.rule_code} (v${rule.version}) under regime ${regime?.regime_code || 'VAT'}`,
          });
        }
      }

      totalTaxableBase = totalTaxableBase.add(netLineBase);
      totalTaxAmount = totalTaxAmount.add(lineTotalTax);
    }

    // Format breakdown
    const formattedBreakdown: Record<string, { code: string; name: string; rate: string; taxable_base: string; tax_amount: string; jurisdiction: string }> = {};
    for (const [code, item] of Object.entries(taxBreakdownMap)) {
      formattedBreakdown[code] = {
        code: item.code,
        name: item.name,
        rate: item.rate,
        taxable_base: item.taxable_base.toString(2),
        tax_amount: item.tax_amount.toString(2),
        jurisdiction: item.jurisdiction,
      };
    }

    const ruleVersionsRecord: Record<string, number> = {};
    for (const l of calculatedLines) {
      if (l.rule_code) {
        ruleVersionsRecord[l.rule_code] = l.rule_version;
      }
    }

    // Build immutable snapshot payload
    const snapshotNumber = `TXS-${Date.now().toString().slice(-6)}`;
    const snapshotId = `txs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const snapshotPayload = JSON.stringify({
      tenant_id,
      legal_entity_id,
      transaction_date,
      currency_code,
      total_taxable_amount: totalTaxableBase.toString(2),
      total_tax_amount: totalTaxAmount.toString(2),
      lines: calculatedLines,
      rule_versions: ruleVersionsRecord,
    });

    const immutableHash = crypto.createHash('sha256').update(snapshotPayload).digest('hex');

    const snapshot: TaxDocumentSnapshot = {
      id: snapshotId,
      tenant_id,
      document_type: transaction_type,
      document_id: `doc_${Date.now()}`,
      snapshot_number: snapshotNumber,
      calculated_at: nowIso,
      currency_code,
      rule_versions: ruleVersionsRecord,
      total_taxable_amount: totalTaxableBase.toString(2),
      total_tax_amount: totalTaxAmount.toString(2),
      total_output_tax: totalOutputTax.toString(2),
      total_input_tax: totalInputTax.toString(2),
      total_reverse_charge: totalReverseCharge.toString(2),
      total_withholding: totalWithholding.toString(2),
      lines: calculatedLines,
      tax_breakdown_by_code: formattedBreakdown,
      tax_registration_references: {
        legal_entity_registration: context.customer_tax_registration || null,
        counterparty_registration: context.vendor_tax_registration || null,
      },
      immutable_hash: immutableHash,
    };

    return {
      success: true,
      currency_code,
      total_taxable_base: totalTaxableBase.toString(2),
      total_tax_amount: totalTaxAmount.toString(2),
      total_output_tax: totalOutputTax.toString(2),
      total_input_tax: totalInputTax.toString(2),
      total_reverse_charge_tax: totalReverseCharge.toString(2),
      total_withholding_tax: totalWithholding.toString(2),
      lines: calculatedLines,
      tax_breakdown_by_code: formattedBreakdown,
      determination_trace: {
        seller_jurisdiction: sellerJurisdiction?.jurisdiction_code || seller_country_code,
        buyer_jurisdiction: buyerJurisdiction?.jurisdiction_code || buyer_country_code,
        place_of_supply: buyerJurisdiction?.jurisdiction_name || sellerJurisdiction?.jurisdiction_name || 'Standard',
        rules_matched: traceRulesMatched,
        timestamp: nowIso,
      },
      snapshot,
    };
  }

  /**
   * Determine matching active rules using priority matrix
   */
  private determineApplicableRules(
    activeRules: TaxRuleMaster[],
    params: {
      context: TaxContext;
      line: TaxContext['lines'][0];
      sellerJurisdiction?: TaxJurisdiction;
      buyerJurisdiction?: TaxJurisdiction;
      amount: Decimal;
    }
  ): TaxRuleMaster[] {
    const { context, line, sellerJurisdiction, buyerJurisdiction, amount } = params;

    // Filter rules
    const candidates = activeRules.filter((r) => {
      // 1. Transaction Type Check
      if (r.transaction_type !== 'ALL' && r.transaction_type !== context.transaction_type) {
        return false;
      }

      // 2. Customer Classification Check
      if (context.customer_classification && r.customer_classification !== 'ALL' && r.customer_classification !== context.customer_classification) {
        return false;
      }

      // 3. Tax Category Check
      if (line.tax_category_id && r.tax_category_id && r.tax_category_id !== line.tax_category_id) {
        return false;
      }

      // 4. Jurisdiction Matching
      if (r.seller_jurisdiction_id && sellerJurisdiction && r.seller_jurisdiction_id !== sellerJurisdiction.id) {
        return false;
      }
      if (r.buyer_jurisdiction_id && buyerJurisdiction && r.buyer_jurisdiction_id !== buyerJurisdiction.id) {
        return false;
      }

      // 5. Threshold Checks
      if (r.min_threshold_amount && amount.lt(new Decimal(r.min_threshold_amount))) {
        return false;
      }
      if (r.max_threshold_amount && amount.gt(new Decimal(r.max_threshold_amount))) {
        return false;
      }

      return true;
    });

    // Sort candidates by priority descending (higher priority executes first)
    candidates.sort((a, b) => b.priority - a.priority);

    if (candidates.length > 0) {
      return [candidates[0]]; // Return highest priority matching rule
    }

    return [];
  }

  /**
   * Find valid active rate by tax code and effective date
   */
  private findActiveRate(taxCodeId: string, transactionDate: string): TaxRateMaster | null {
    const rates = Array.from(db.taxRates.values()).filter(
      (r) =>
        r.tax_code_id === taxCodeId &&
        r.status === 'ACTIVE' &&
        r.deleted_at === null &&
        r.effective_from <= transactionDate &&
        (!r.effective_to || r.effective_to >= transactionDate)
    );

    if (rates.length === 0) return null;
    // Return latest effective
    rates.sort((a, b) => b.effective_from.localeCompare(a.effective_from));
    return rates[0];
  }

  /**
   * Validate Exemption Certificate
   */
  private findValidExemption(
    tenantId: string,
    params: {
      customer_id?: string | null;
      vendor_id?: string | null;
      product_id?: string | null;
      jurisdiction_id?: string | null;
      certificate_number?: string | null;
      date: string;
    }
  ): TaxExemptionRecord | null {
    const exemptions = Array.from(db.taxExemptions.values()).filter(
      (e) =>
        e.tenant_id === tenantId &&
        e.status === 'ACTIVE' &&
        e.approval_status === 'APPROVED' &&
        e.deleted_at === null &&
        e.effective_from <= params.date &&
        e.effective_to >= params.date
    );

    if (params.certificate_number) {
      const matchByCert = exemptions.find((e) => e.certificate_number.trim() === params.certificate_number?.trim());
      if (matchByCert) return matchByCert;
    }

    if (params.customer_id) {
      const matchByCust = exemptions.find((e) => e.customer_id === params.customer_id);
      if (matchByCust) return matchByCust;
    }

    return null;
  }

  /**
   * Retrieve Approved Active Rules respecting date and cache
   */
  private getActiveApprovedRules(tenantId: string, transactionDate: string, enableCache: boolean = true): TaxRuleMaster[] {
    const cacheKey = `${tenantId}_${transactionDate}`;
    if (enableCache) {
      const cached = this.ruleCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
        return cached.rules;
      }
    }

    const rules = Array.from(db.taxRules.values()).filter(
      (r) =>
        r.tenant_id === tenantId &&
        r.status === 'ACTIVE' &&
        r.approval_status === 'ACTIVE' &&
        r.deleted_at === null &&
        r.effective_from <= transactionDate &&
        (!r.effective_to || r.effective_to >= transactionDate)
    );

    if (enableCache) {
      this.ruleCache.set(cacheKey, { rules, timestamp: Date.now() });
    }

    return rules;
  }
}

export const taxEngine = GlobalTaxEngine.getInstance();
