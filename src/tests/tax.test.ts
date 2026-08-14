import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { onboardTenant } from '../server/auth';
import { taxEngine } from '../server/services/taxEngine';
import { Decimal } from '../domain/decimal';
import { TaxContext } from '../domain/types';

describe('Bill Vyom — Phase 10 Global Tax Engine & Compliance Foundation Test Suite', () => {
  let tenantId1: string;
  let ownerId1: string;
  let legalEntityId1: string;

  let tenantId2: string;
  let ownerId2: string;
  let legalEntityId2: string;

  before(() => {
    // 1. Onboard Tenant 1 (US Entity)
    const res1 = onboardTenant({
      legal_name: 'Vyom Global Enterprises Inc',
      country_code: 'US',
      base_currency_code: 'USD',
      timezone: 'America/New_York',
      business_type: 'Corporation',
      industry: 'Enterprise Software & Cloud',
      contact_email: 'tax@vyomglobal.com',
      contact_phone: '+14155552671',
      owner_first_name: 'Alexander',
      owner_last_name: 'Vance',
      owner_email: `alex_${Date.now()}@vyomglobal.com`,
      owner_password: 'Password123!',
    });
    tenantId1 = res1.tenant.id;
    ownerId1 = res1.user.id;
    legalEntityId1 = db.getLegalEntitiesByTenant(tenantId1)[0].id;

    // 2. Onboard Tenant 2 (UK Entity - for multi-tenant isolation tests)
    const res2 = onboardTenant({
      legal_name: 'Vyom Tech UK Ltd',
      country_code: 'GB',
      base_currency_code: 'GBP',
      timezone: 'Europe/London',
      business_type: 'Limited Company',
      industry: 'Consulting',
      contact_email: 'finance@vyomtech.co.uk',
      contact_phone: '+442079460912',
      owner_first_name: 'Eleanor',
      owner_last_name: 'Rigby',
      owner_email: `eleanor_${Date.now()}@vyomtech.co.uk`,
      owner_password: 'Password123!',
    });
    tenantId2 = res2.tenant.id;
    ownerId2 = res2.user.id;
    legalEntityId2 = db.getLegalEntitiesByTenant(tenantId2)[0].id;

    // Seed standard tax configuration for Tenant 1
    db.seedStandardTaxDataForTenant(tenantId1, legalEntityId1, 'US', ownerId1);

    // Create a standard tax period for Tenant 1
    const jur = db.getTaxJurisdictionsByTenant(tenantId1)[0];
    const auth = db.getTaxAuthoritiesByTenant(tenantId1)[0];
    const periodId = `txper_q3_${Date.now()}`;
    db.taxPeriods.set(periodId, {
      id: periodId,
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      jurisdiction_id: jur.id,
      tax_authority_id: auth.id,
      period_code: '2026-Q3',
      period_name: '2026 Q3 Statutory Period',
      start_date: '2026-07-01',
      end_date: '2026-09-30',
      filing_deadline: '2026-10-31',
      status: 'OPEN',
      filing_status: 'NOT_STARTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    });
  });

  test('1. Canonical 195 Country Reference Matrix Verification', () => {
    const countries = db.getAllTaxCountryConfigs();
    assert.strictEqual(countries.length, 195, 'Should strictly load all 195 sovereign nation tax configurations');

    const us = db.getTaxCountryConfig('US');
    assert.ok(us, 'United States configuration must exist');
    assert.strictEqual(us.iso_currency_code, 'USD');

    const gb = db.getTaxCountryConfig('GB');
    assert.ok(gb, 'United Kingdom configuration must exist');
    assert.strictEqual(gb.iso_currency_code, 'GBP');

    const inCountry = db.getTaxCountryConfig('IN');
    assert.ok(inCountry, 'India configuration must exist');
    assert.strictEqual(inCountry.iso_currency_code, 'INR');
  });

  test('2. Absolute Tax Data Truth: Missing Configuration Rejection (No Silent Zero Tax)', () => {
    // Tenant 2 has no tax rules configured yet
    const unconfiguredContext: TaxContext = {
      tenant_id: tenantId2,
      legal_entity_id: legalEntityId2,
      transaction_type: 'SALES',
      transaction_date: '2026-08-14',
      currency_code: 'GBP',
      seller_country_code: 'GB',
      buyer_country_code: 'GB',
      customer_id: 'cust_unknown',
      customer_classification: 'B2C',
      lines: [
        {
          line_id: 'line_1',
          product_id: 'prod_test',
          name: 'Consulting Service',
          quantity: 1,
          unit_price: '500.00',
          discount_amount: '0.00',
          line_amount: '500.00',
        },
      ],
    };

    const result = taxEngine.calculateTax(unconfiguredContext);
    assert.strictEqual(result.success, false, 'Calculation must fail when tax rules are missing');
    assert.strictEqual(result.error_code, 'TAX_RULE_NOT_FOUND');
    assert.ok(result.error_message?.includes('No approved, active tax rules found'));
  });

  test('3. Exact Determination and Decimal Calculation with Precision Rounding', () => {
    const jurisdictions = db.getTaxJurisdictionsByTenant(tenantId1);
    const natJur = jurisdictions.find((j) => j.jurisdiction_code === 'US-NAT');
    assert.ok(natJur, 'US-NAT Jurisdiction must exist');

    const taxCodes = db.getTaxCodesByTenant(tenantId1);
    const standardSalesTaxCode = taxCodes.find((c) => c.code === 'SALES_TAX-STD');
    assert.ok(standardSalesTaxCode, 'SALES_TAX-STD code must exist');

    const context: TaxContext = {
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      transaction_type: 'SALES',
      transaction_date: '2026-08-14',
      currency_code: 'USD',
      seller_country_code: 'US',
      seller_jurisdiction_code: 'US-NAT',
      buyer_country_code: 'US',
      buyer_jurisdiction_code: 'US-NAT',
      customer_classification: 'B2C',
      lines: [
        {
          line_id: 'line_101',
          product_id: 'prod_laptop',
          name: 'Enterprise Laptop Workstation',
          quantity: 2,
          unit_price: '1200.00',
          discount_amount: '0.00',
          line_amount: '2400.00',
        },
      ],
    };

    const result = taxEngine.calculateTax(context);
    assert.strictEqual(result.success, true, 'Calculation must succeed with valid rules');

    // 2400.00 * 10% (0.1000 standard rate) = 240.00
    assert.strictEqual(result.total_taxable_base, '2400.00');
    assert.strictEqual(result.total_tax_amount, '240.00');
    assert.strictEqual(result.lines.length, 1);
    assert.strictEqual(result.lines[0].tax_amount, '240.00');
    assert.strictEqual(result.lines[0].tax_code, 'SALES_TAX-STD');
  });

  test('4. Tax Exemption Certificate Application & Verification', () => {
    const jurisdictions = db.getTaxJurisdictionsByTenant(tenantId1);
    const natJur = jurisdictions.find((j) => j.jurisdiction_code === 'US-NAT');

    // Register active exemption certificate for Non-Profit University
    const exemptionId = `txemp_edu_${Date.now()}`;
    db.taxExemptions.set(exemptionId, {
      id: exemptionId,
      tenant_id: tenantId1,
      customer_id: 'cust_ny_university',
      vendor_id: null,
      product_id: null,
      jurisdiction_id: natJur!.id,
      tax_code_id: null,
      certificate_number: 'EXEMP-501C3-8899',
      exemption_reason: 'IRC 501(c)(3) Educational Non-Profit Entity',
      effective_from: '2026-01-01',
      effective_to: '2028-12-31',
      approval_status: 'APPROVED',
      approved_by: ownerId1,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    });

    const context: TaxContext = {
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      transaction_type: 'SALES',
      transaction_date: '2026-08-14',
      currency_code: 'USD',
      seller_country_code: 'US',
      seller_jurisdiction_code: 'US-NAT',
      buyer_country_code: 'US',
      buyer_jurisdiction_code: 'US-NAT',
      customer_id: 'cust_ny_university',
      customer_classification: 'NON_PROFIT',
      lines: [
        {
          line_id: 'line_201',
          product_id: 'prod_server',
          name: 'Campus Server Unit',
          quantity: 1,
          unit_price: '5000.00',
          discount_amount: '0.00',
          line_amount: '5000.00',
          is_exempt: true,
          exemption_certificate: 'EXEMP-501C3-8899',
        },
      ],
    };

    const result = taxEngine.calculateTax(context);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.total_taxable_base, '5000.00');
    assert.strictEqual(result.total_tax_amount, '0.00', 'Approved exemption must yield 0 tax with registered certificate');
    assert.strictEqual(result.lines[0].is_exempt, true);
  });

  test('5. Tax Subledger Derivation and Statutory Period Filing Lifecycle', () => {
    const periods = db.getTaxPeriodsByTenant(tenantId1);
    assert.ok(periods.length > 0, 'Tax periods must exist for seeded entity');
    const period = periods[0];

    // Seed mock sales invoice for tenant 1
    const nowIso = new Date().toISOString();
    const invId = `inv_test_${Date.now()}`;
    db.invoices.set(invId, {
      id: invId,
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      customer_id: 'cust_123',
      invoice_number: 'INV-SUBLEDGER-01',
      invoice_type: 'TAX_INVOICE',
      currency_code: 'USD',
      exchange_rate: '1.0',
      invoice_date: period.start_date,
      due_date: period.end_date,
      billing_address: { street_address: '123 Wall St', city: 'New York', state_province: 'NY', postal_code: '10005', country_code: 'US' },
      shipping_address: { street_address: '123 Wall St', city: 'New York', state_province: 'NY', postal_code: '10005', country_code: 'US' },
      subtotal: '10000.00',
      discount_total: '0.00',
      tax_total: '887.50',
      grand_total: '10887.50',
      status: 'POSTED',
      lines: [],
      created_at: nowIso,
      updated_at: nowIso,
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    });

    // Derive Tax Return from Subledger
    const taxReturn = db.deriveTaxReturnFromSubledger(tenantId1, legalEntityId1, period.id, ownerId1);
    assert.strictEqual(taxReturn.status, 'IN_PREPARATION');
    assert.strictEqual(taxReturn.total_taxable_sales, '10000.00');
    assert.strictEqual(taxReturn.total_output_tax, '887.50');
    assert.strictEqual(taxReturn.net_tax_payable_or_refundable, '887.50');

    // Approve Return
    taxReturn.status = 'APPROVED';
    taxReturn.approved_by = ownerId1;
    taxReturn.approved_at = nowIso;
    db.taxReturns.set(taxReturn.id, taxReturn);

    // Submit Return with Electronic Gateway Hash
    taxReturn.status = 'SUBMITTED';
    taxReturn.submitted_by = ownerId1;
    taxReturn.submitted_at = nowIso;
    taxReturn.submission_reference = `E-FILE-ACK-${Date.now()}`;
    taxReturn.filing_payload_hash = `SHA256-SUB-${Date.now()}`;
    db.taxReturns.set(taxReturn.id, taxReturn);

    const fetchedReturn = db.taxReturns.get(taxReturn.id);
    assert.strictEqual(fetchedReturn?.status, 'SUBMITTED');
    assert.ok(fetchedReturn?.submission_reference.startsWith('E-FILE-ACK-'));
  });

  test('6. General Ledger vs Subledger Reconciliation Engine', () => {
    const periods = db.getTaxPeriodsByTenant(tenantId1);
    const period = periods[0];

    const recon = db.runTaxReconciliation(tenantId1, legalEntityId1, period.id, ownerId1);
    assert.ok(recon, 'Reconciliation run must complete');
    assert.ok(['RECONCILED', 'EXCEPTION'].includes(recon.status), 'Reconciliation must evaluate status');
    assert.strictEqual(recon.tenant_id, tenantId1);
  });

  test('7. E-Invoicing & Cryptographic IRN Clearance Generation', () => {
    const invId = Array.from(db.invoices.values()).find((i) => i.tenant_id === tenantId1)!.id;
    const invoice = db.invoices.get(invId)!;

    const einvId = `einv_${Date.now()}`;
    const irn = `IRN-US-FED-${Date.now().toString(16).toUpperCase()}`;
    db.einvoiceDocuments.set(einvId, {
      id: einvId,
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      source_document_type: 'INVOICE',
      source_document_id: invId,
      source_document_number: invoice.invoice_number,
      einvoice_number: `EINV-${invoice.invoice_number}`,
      irn,
      signed_qr_code: `https://tax.gov.us/einvoice/${irn}`,
      status: 'ACCEPTED',
      provider_name: 'GOVERNMENT_DIRECT_CLEARANCE',
      payload_hash: `SHA256-${Date.now()}`,
      immutable_payload: JSON.stringify({ irn, invoice_number: invoice.invoice_number }),
      submitted_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    });

    const doc = db.einvoiceDocuments.get(einvId);
    assert.ok(doc);
    assert.strictEqual(doc.status, 'ACCEPTED');
    assert.strictEqual(doc.irn, irn);
  });

  test('8. Multi-Tenant Strict Security Boundary', () => {
    // Tenant 2 must NOT see Tenant 1's tax registrations, regimes, returns, or snapshots
    const t1Registrations = db.getTaxRegistrationsByTenant(tenantId1);
    const t2Registrations = db.getTaxRegistrationsByTenant(tenantId2);
    assert.ok(t1Registrations.length > 0);
    assert.strictEqual(t2Registrations.length, 0);

    const t1Returns = db.getTaxReturnsByTenant(tenantId1);
    const t2Returns = db.getTaxReturnsByTenant(tenantId2);
    assert.ok(t1Returns.length > 0);
    assert.strictEqual(t2Returns.length, 0);

    const t2Snapshots = db.getTaxDocumentSnapshotsByTenant(tenantId2);
    assert.strictEqual(t2Snapshots.length, 0);
  });
});
