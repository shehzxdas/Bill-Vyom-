/**
 * Bill Vyom — Phase 11 Global E-Invoicing & Fiscal Document Compliance Engine Test Suite
 * Authoritative verification of deterministic hashing, sovereign adapters, idempotency,
 * resilient retries, webhook deduplication, multi-level fiscal reconciliation, and multi-tenant isolation.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { onboardTenant } from '../server/auth';
import { complianceEngine } from '../server/services/complianceEngine';
import { Decimal } from '../domain/decimal';
import { Invoice } from '../domain/types';

describe('Bill Vyom — Phase 11 Global E-Invoicing & Fiscal Compliance Test Suite', () => {
  let tenantId1: string;
  let ownerId1: string;
  let legalEntityId1: string;

  let tenantId2: string;
  let ownerId2: string;
  let legalEntityId2: string;

  before(() => {
    // 1. Onboard Tenant 1 (US / Global Operations)
    const res1 = onboardTenant({
      legal_name: 'Vyom Global Technologies Inc',
      country_code: 'US',
      base_currency_code: 'USD',
      timezone: 'America/New_York',
      business_type: 'Corporation',
      industry: 'Enterprise Software & Cloud',
      contact_email: 'compliance@vyomglobal.com',
      contact_phone: '+14155550199',
      owner_first_name: 'Elena',
      owner_last_name: 'Rostova',
      owner_email: `elena_${Date.now()}@vyomglobal.com`,
      owner_password: 'Password123!',
    });
    tenantId1 = res1.tenant.id;
    ownerId1 = res1.user.id;
    legalEntityId1 = db.getLegalEntitiesByTenant(tenantId1)[0].id;

    // 2. Onboard Tenant 2 (UK Operations - for strict multi-tenant isolation tests)
    const res2 = onboardTenant({
      legal_name: 'Vyom Europe Ltd',
      country_code: 'GB',
      base_currency_code: 'GBP',
      timezone: 'Europe/London',
      business_type: 'Private Limited',
      industry: 'Cloud Infrastructure',
      contact_email: 'finance@vyomeurope.co.uk',
      contact_phone: '+442079460123',
      owner_first_name: 'Arthur',
      owner_last_name: 'Pendleton',
      owner_email: `arthur_${Date.now()}@vyomeurope.co.uk`,
      owner_password: 'Password123!',
    });
    tenantId2 = res2.tenant.id;
    ownerId2 = res2.user.id;
    legalEntityId2 = db.getLegalEntitiesByTenant(tenantId2)[0].id;

    // Seed standard tax and compliance data
    db.seedStandardTaxDataForTenant(tenantId1, legalEntityId1, 'US', ownerId1);
    db.seedStandardComplianceDataForTenant(tenantId1, legalEntityId1, 'US', ownerId1);

    db.seedStandardTaxDataForTenant(tenantId2, legalEntityId2, 'GB', ownerId2);
    db.seedStandardComplianceDataForTenant(tenantId2, legalEntityId2, 'GB', ownerId2);
  });

  test('1. Should generate canonical Fiscal Document from commercial Invoice with deterministic hash', () => {
    // Create a mock commercial invoice
    const invId = `inv_test_${Date.now()}`;
    const mockInvoice: any = {
      id: invId,
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      branch_id: null,
      customer_id: 'cust_global_1',
      invoice_number: 'INV-2026-0001',
      invoice_date: '2026-08-14',
      due_date: '2026-09-14',
      currency_code: 'USD',
      exchange_rate: '1.0000',
      status: 'POSTED',
      subtotal: '1000.00',
      discount_total: '0.00',
      tax_total: '100.00',
      grand_total: '1100.00',
      subtotal_amount: '1000.00',
      discount_amount: '0.00',
      tax_amount: '100.00',
      total_amount: '1100.00',
      amount_paid: '0.00',
      amount_due: '1100.00',
      lines: [
        {
          id: `line_1_${Date.now()}`,
          tenant_id: tenantId1,
          invoice_id: invId,
          line_number: 1,
          product_id: 'prod_cloud_license',
          product_code: 'LIC-ENTERPRISE',
          description: 'Enterprise Cloud Platform Subscription',
          quantity: 1,
          uom: 'USER',
          unit_price: '1000.00',
          discount_percentage: '0.00',
          discount_amount: '0.00',
          tax_code_id: 'tc_std',
          tax_code: 'STANDARD',
          tax_rate: '0.1000',
          tax_amount: '100.00',
          line_subtotal: '1000.00',
          line_total: '1100.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: ownerId1,
          updated_by: ownerId1,
          deleted_at: null,
          version: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(mockInvoice.id, mockInvoice);

    const fiscalDoc = complianceEngine.generateFiscalDocumentFromInvoice(
      tenantId1,
      mockInvoice.id,
      ownerId1,
      'B2B'
    );

    assert.ok(fiscalDoc);
    assert.strictEqual(fiscalDoc.source_document_id, mockInvoice.id);
    assert.strictEqual(fiscalDoc.fiscal_document_type, 'INVOICE');
    assert.strictEqual(fiscalDoc.status, 'READY');
    assert.strictEqual(fiscalDoc.sequence_number, 1);
    assert.ok(fiscalDoc.document_hash);
    assert.strictEqual(fiscalDoc.document_hash.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
    assert.strictEqual(fiscalDoc.subtotal, '1000.00');
    assert.strictEqual(fiscalDoc.tax_total, '100.00');
    assert.strictEqual(fiscalDoc.grand_total, '1100.00');
  });

  test('2. Should successfully validate and finalize a valid Fiscal Document', () => {
    const docs = db.getFiscalDocumentsByTenant(tenantId1);
    assert.ok(docs.length > 0);
    const doc = docs[0];

    const validation = complianceEngine.validateFiscalDocument(doc);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.issues.length, 0);

    const finalizedDoc = complianceEngine.finalizeFiscalDocument(tenantId1, doc.id, ownerId1);
    assert.strictEqual(finalizedDoc.status, 'FINALIZED');
    assert.ok(finalizedDoc.finalized_at);
  });

  test('3. India GSTN Adapter: Should enforce 15-digit GSTIN and generate 64-char IRN and QR code', () => {
    const inEntityId = `le_in_${Date.now()}`;
    const inEntity = {
      id: inEntityId,
      tenant_id: tenantId1,
      entity_code: 'LE-IN-01',
      legal_name: 'Vyom Technologies India Pvt Ltd',
      country_code: 'IN',
      currency_code: 'INR',
      timezone: 'Asia/Kolkata',
      jurisdiction_code: 'IN',
      tax_registrations: [
        {
          id: 'reg_in_gst',
          registration_type: 'GSTIN',
          registration_number: '29ABCDE1234F1Z5',
          jurisdiction_code: 'IN',
          is_primary: true,
        },
      ],
      fiscal_start_month: 4,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.legalEntities.set(inEntity.id, inEntity);

    // Create Indian commercial invoice
    const inInv: any = {
      id: `inv_in_${Date.now()}`,
      tenant_id: tenantId1,
      legal_entity_id: inEntity.id,
      branch_id: null,
      customer_id: 'cust_in_1',
      invoice_number: 'INV-IN-2026-0001',
      invoice_date: '2026-08-14',
      due_date: '2026-09-14',
      currency_code: 'INR',
      exchange_rate: '1.0000',
      status: 'POSTED',
      subtotal: '50000.00',
      discount_total: '0.00',
      tax_total: '9000.00',
      grand_total: '59000.00',
      subtotal_amount: '50000.00',
      discount_amount: '0.00',
      tax_amount: '9000.00',
      total_amount: '59000.00',
      amount_paid: '0.00',
      amount_due: '59000.00',
      lines: [
        {
          id: `line_in_${Date.now()}`,
          tenant_id: tenantId1,
          invoice_id: `inv_in_${Date.now()}`,
          line_number: 1,
          product_id: 'prod_serv_1',
          product_code: '998313',
          description: 'IT Consulting & Cloud Implementation Services',
          quantity: 1,
          uom: 'SVC',
          unit_price: '50000.00',
          discount_percentage: '0.00',
          discount_amount: '0.00',
          tax_code_id: 'tc_gst18',
          tax_code: 'GST_18',
          tax_rate: '0.1800',
          tax_amount: '9000.00',
          line_subtotal: '50000.00',
          line_total: '59000.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: ownerId1,
          updated_by: ownerId1,
          deleted_at: null,
          version: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(inInv.id, inInv);

    const fiscalDocIn = complianceEngine.generateFiscalDocumentFromInvoice(
      tenantId1,
      inInv.id,
      ownerId1,
      'B2B'
    );

    assert.ok(fiscalDocIn);
    assert.strictEqual(fiscalDocIn.country_code, 'IN');
    assert.ok(fiscalDocIn.irn);
    assert.strictEqual(fiscalDocIn.irn.length, 64, 'Indian IRN must be a 64-char SHA256 hex string');
    assert.ok(fiscalDocIn.qr_code_payload);
    assert.ok(fiscalDocIn.qr_code_payload.includes('einvoice1.gst.gov.in'));

    // Test payload transformation
    const adapter = complianceEngine.getAdapter('IN');
    const { payload, format } = adapter.transformToPayload(fiscalDocIn);
    assert.strictEqual(format, 'GSTN_JSON_INV01');
    const parsed = JSON.parse(payload);
    assert.strictEqual(parsed.SellerDtls.Gstin, '29ABCDE1234F1Z5');
    assert.strictEqual(parsed.ValDtls.TotInvVal, 59000);
  });

  test('4. EU / Peppol BIS 3.0 Adapter: Should generate valid UBL 2.1 XML structure', () => {
    const gbDoc = db.getFiscalDocumentsByTenant(tenantId2);
    // Create an invoice for UK if not existing
    const ukEntity = db.getLegalEntitiesByTenant(tenantId2)[0];
    const ukInv: any = {
      id: `inv_uk_${Date.now()}`,
      tenant_id: tenantId2,
      legal_entity_id: ukEntity.id,
      branch_id: null,
      customer_id: 'cust_uk_1',
      invoice_number: 'INV-UK-1001',
      invoice_date: '2026-08-14',
      due_date: '2026-09-14',
      currency_code: 'GBP',
      exchange_rate: '1.0000',
      status: 'POSTED',
      subtotal: '2000.00',
      discount_total: '0.00',
      tax_total: '400.00',
      grand_total: '2400.00',
      subtotal_amount: '2000.00',
      discount_amount: '0.00',
      tax_amount: '400.00',
      total_amount: '2400.00',
      amount_paid: '0.00',
      amount_due: '2400.00',
      lines: [
        {
          id: `line_uk_${Date.now()}`,
          tenant_id: tenantId2,
          invoice_id: `inv_uk_${Date.now()}`,
          line_number: 1,
          product_id: 'prod_uk_1',
          product_code: 'UK-SERV',
          description: 'Consulting services London',
          quantity: 1,
          uom: 'HRS',
          unit_price: '2000.00',
          discount_percentage: '0.00',
          discount_amount: '0.00',
          tax_code_id: 'tc_vat20',
          tax_code: 'VAT_20',
          tax_rate: '0.2000',
          tax_amount: '400.00',
          line_subtotal: '2000.00',
          line_total: '2400.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: ownerId2,
          updated_by: ownerId2,
          deleted_at: null,
          version: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId2,
      updated_by: ownerId2,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(ukInv.id, ukInv);

    const fiscalDocUk = complianceEngine.generateFiscalDocumentFromInvoice(
      tenantId2,
      ukInv.id,
      ownerId2,
      'B2B'
    );

    const adapter = complianceEngine.getAdapter('GB');
    const { payload, format, mimeType } = adapter.transformToPayload(fiscalDocUk);

    assert.strictEqual(format, 'PEPPOL_UBL_2_1');
    assert.strictEqual(mimeType, 'application/xml');
    assert.ok(payload.includes('<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>'));
    assert.ok(payload.includes('<cbc:DocumentCurrencyCode>GBP</cbc:DocumentCurrencyCode>'));
    assert.ok(payload.includes('<cbc:PayableAmount currencyID="GBP">2400.00</cbc:PayableAmount>'));
  });

  test('5. Saudi Arabia ZATCA Adapter: Should generate TLV-encoded Base64 QR code and XML', () => {
    const saEntityId = `le_sa_${Date.now()}`;
    const saEntity = {
      id: saEntityId,
      tenant_id: tenantId1,
      entity_code: 'LE-SA-01',
      legal_name: 'Vyom Middle East FZ LLC',
      country_code: 'SA',
      currency_code: 'SAR',
      timezone: 'Asia/Riyadh',
      jurisdiction_code: 'SA',
      tax_registrations: [
        {
          id: 'reg_sa_vat',
          registration_type: 'VAT',
          registration_number: '310123456700003',
          jurisdiction_code: 'SA',
          is_primary: true,
        },
      ],
      fiscal_start_month: 1,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.legalEntities.set(saEntity.id, saEntity);

    const saInv: any = {
      id: `inv_sa_${Date.now()}`,
      tenant_id: tenantId1,
      legal_entity_id: saEntity.id,
      branch_id: null,
      customer_id: 'cust_sa_1',
      invoice_number: 'INV-SA-001',
      invoice_date: '2026-08-14',
      due_date: '2026-09-14',
      currency_code: 'SAR',
      exchange_rate: '1.0000',
      status: 'POSTED',
      subtotal: '10000.00',
      discount_total: '0.00',
      tax_total: '1500.00',
      grand_total: '11500.00',
      subtotal_amount: '10000.00',
      discount_amount: '0.00',
      tax_amount: '1500.00',
      total_amount: '11500.00',
      amount_paid: '0.00',
      amount_due: '11500.00',
      lines: [
        {
          id: `line_sa_${Date.now()}`,
          tenant_id: tenantId1,
          invoice_id: `inv_sa_${Date.now()}`,
          line_number: 1,
          product_id: 'prod_sa_1',
          product_code: 'CLOUD-SA',
          description: 'Saudi Riyadh Cloud Region Host',
          quantity: 1,
          uom: 'MTH',
          unit_price: '10000.00',
          discount_percentage: '0.00',
          discount_amount: '0.00',
          tax_code_id: 'tc_vat15',
          tax_code: 'VAT_15',
          tax_rate: '0.1500',
          tax_amount: '1500.00',
          line_subtotal: '10000.00',
          line_total: '11500.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: ownerId1,
          updated_by: ownerId1,
          deleted_at: null,
          version: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(saInv.id, saInv);

    const fiscalDocSa = complianceEngine.generateFiscalDocumentFromInvoice(
      tenantId1,
      saInv.id,
      ownerId1,
      'B2B'
    );

    assert.ok(fiscalDocSa.qr_code_payload);
    // Base64 decoded buffer check
    const decoded = Buffer.from(fiscalDocSa.qr_code_payload, 'base64');
    assert.ok(decoded.length > 0);
    assert.strictEqual(decoded[0], 1, 'Tag 1 should be Seller Name');

    const adapter = complianceEngine.getAdapter('SA');
    const { payload, format } = adapter.transformToPayload(fiscalDocSa);
    assert.strictEqual(format, 'ZATCA_UBL_2_1');
    assert.ok(payload.includes('<cbc:ID>QR</cbc:ID>'));
  });

  test('6. Submission Execution & Idempotency: Submitting duplicate document returns existing accepted record without duplicate attempt', async () => {
    const docs = db.getFiscalDocumentsByTenant(tenantId1);
    const doc = docs[0];
    const provConfigs = db.getComplianceProviderConfigsByTenant(tenantId1);
    assert.ok(provConfigs.length > 0);

    const res1 = await complianceEngine.submitFiscalDocument(tenantId1, doc.id, provConfigs[0].id, ownerId1);
    assert.strictEqual(res1.submission.status, 'ACCEPTED');
    assert.ok(res1.submission.authority_reference);

    // Immediate duplicate submit
    const res2 = await complianceEngine.submitFiscalDocument(tenantId1, doc.id, provConfigs[0].id, ownerId1);
    assert.strictEqual(res2.submission.id, res1.submission.id);
    assert.strictEqual(res2.submission.status, 'ACCEPTED');
    assert.strictEqual(res2.attempt.id, res1.attempt.id, 'No duplicate submission attempt generated on idempotent resubmit');
  });

  test('7. Resilient Retries & Manual Review: Transient failure queues retry, fatal error escalates to Manual Review', async () => {
    // Create an invoice designed to trigger transient error
    const provConfigs = db.getComplianceProviderConfigsByTenant(tenantId1);
    const invTransient: any = {
      id: `inv_transient_${Date.now()}`,
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      branch_id: null,
      customer_id: 'cust_transient',
      invoice_number: 'INV-TRANSIENT-1',
      invoice_date: '2026-08-14',
      due_date: '2026-09-14',
      currency_code: 'USD',
      exchange_rate: '1.0000',
      status: 'POSTED',
      subtotal: '100.00',
      discount_total: '0.00',
      tax_total: '10.00',
      grand_total: '110.00',
      subtotal_amount: '100.00',
      discount_amount: '0.00',
      tax_amount: '10.00',
      total_amount: '110.00',
      amount_paid: '0.00',
      amount_due: '110.00',
      lines: [
        {
          id: `line_trans_${Date.now()}`,
          tenant_id: tenantId1,
          invoice_id: `inv_transient_${Date.now()}`,
          line_number: 1,
          product_id: 'p1',
          product_code: 'P1',
          description: 'Item 1',
          quantity: 1,
          uom: 'UNIT',
          unit_price: '100.00',
          discount_percentage: '0.00',
          discount_amount: '0.00',
          tax_code_id: 'tc_1',
          tax_code: 'STD',
          tax_rate: '0.1000',
          tax_amount: '10.00',
          line_subtotal: '100.00',
          line_total: '110.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: ownerId1,
          updated_by: ownerId1,
          deleted_at: null,
          version: 1,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(invTransient.id, invTransient);

    // Create a customer with TRIGGER_TRANSIENT_ERROR in name
    const customerId = `cust_err_${Date.now()}`;
    const customer = {
      id: customerId,
      tenant_id: tenantId1,
      customer_code: 'CUST-ERR-1',
      customer_name: 'Acme Corp TRIGGER_TRANSIENT_ERROR',
      legal_name: 'Acme Corp TRIGGER_TRANSIENT_ERROR',
      customer_type: 'B2B' as const,
      primary_currency_code: 'USD',
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.customers.set(customer.id, customer as any);
    invTransient.customer_id = customer.id;
    db.invoices.set(invTransient.id, invTransient);

    const doc = complianceEngine.generateFiscalDocumentFromInvoice(
      tenantId1,
      invTransient.id,
      ownerId1
    );

    // Attempt 1: Transient Error -> Queued with next_attempt_at
    const res1 = await complianceEngine.submitFiscalDocument(tenantId1, doc.id, provConfigs[0].id, ownerId1);
    assert.strictEqual(res1.submission.status, 'QUEUED');
    assert.ok(res1.submission.next_attempt_at);

    // Attempt 2
    const res2 = await complianceEngine.submitFiscalDocument(tenantId1, doc.id, provConfigs[0].id, ownerId1);
    assert.strictEqual(res2.submission.status, 'QUEUED');

    // Attempt 3 (Max attempts reached) -> Escalates to MANUAL_REVIEW
    const res3 = await complianceEngine.submitFiscalDocument(tenantId1, doc.id, provConfigs[0].id, ownerId1);
    assert.strictEqual(res3.submission.status, 'MANUAL_REVIEW');

    const openReviews = db.getComplianceManualReviewsByTenant(tenantId1);
    assert.ok(openReviews.length > 0);
    const review = openReviews.find((r) => r.fiscal_document_id === doc.id);
    assert.ok(review);
    assert.strictEqual(review.status, 'OPEN');
  });

  test('8. Webhook Ingestion & Deduplication: Processes event and rejects duplicate replay', () => {
    const eventId = `evt_clearance_${Date.now()}`;
    const payload = {
      event_type: 'DOCUMENT.ACCEPTED',
      fiscal_document_id: 'fdoc_any_valid_id',
      authority_reference: 'AUTH-ACK-9999',
    };

    const first = complianceEngine.handleWebhookEvent(
      tenantId1,
      'PeppolAccessPoint',
      eventId,
      'DOCUMENT.ACCEPTED',
      'SIG_VALID',
      payload
    );
    assert.strictEqual(first.success, true);

    // Duplicate replay
    const duplicate = complianceEngine.handleWebhookEvent(
      tenantId1,
      'PeppolAccessPoint',
      eventId,
      'DOCUMENT.ACCEPTED',
      'SIG_VALID',
      payload
    );
    assert.strictEqual(duplicate.success, true);
    assert.ok(duplicate.message.includes('duplicate skipped'));
  });

  test('9. Multi-Level Fiscal Reconciliation: Reconciles commercial invoices and flags missing fiscal documents', () => {
    // Un-fiscalized invoice to test exception detection
    const unFiscalInv: any = {
      id: `inv_unfiscal_${Date.now()}`,
      tenant_id: tenantId1,
      legal_entity_id: legalEntityId1,
      branch_id: null,
      customer_id: 'cust_1',
      invoice_number: 'INV-ORPHAN-001',
      invoice_date: '2026-08-14',
      due_date: '2026-09-14',
      currency_code: 'USD',
      exchange_rate: '1.0000',
      status: 'POSTED',
      subtotal: '500.00',
      discount_total: '0.00',
      tax_total: '50.00',
      grand_total: '550.00',
      subtotal_amount: '500.00',
      discount_amount: '0.00',
      tax_amount: '50.00',
      total_amount: '550.00',
      amount_paid: '0.00',
      amount_due: '550.00',
      lines: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: ownerId1,
      updated_by: ownerId1,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(unFiscalInv.id, unFiscalInv);

    const recResult = complianceEngine.runFiscalReconciliation(tenantId1, legalEntityId1, ownerId1);
    assert.ok(recResult.run);
    assert.ok(recResult.exceptions.length > 0);

    const orphanExc = recResult.exceptions.find((e) => e.source_id === unFiscalInv.id);
    assert.ok(orphanExc);
    assert.strictEqual(orphanExc.exception_type, 'MISSING_FISCAL_DOC');
  });

  test('10. Multi-Tenant Boundary: Tenant 2 cannot access or mutate Tenant 1 Fiscal Documents', () => {
    const tenant1Docs = db.getFiscalDocumentsByTenant(tenantId1);
    assert.ok(tenant1Docs.length > 0);
    const targetDoc = tenant1Docs[0];

    // Attempting to finalize Tenant 1 document using Tenant 2 ID should fail
    assert.throws(
      () => complianceEngine.finalizeFiscalDocument(tenantId2, targetDoc.id, ownerId2),
      /not found/
    );

    // Attempting to cancel Tenant 1 document using Tenant 2 ID should fail
    assert.throws(
      () => complianceEngine.cancelFiscalDocument(tenantId2, targetDoc.id, 'Unauthorized cancel', ownerId2),
      /not found/
    );
  });
});
