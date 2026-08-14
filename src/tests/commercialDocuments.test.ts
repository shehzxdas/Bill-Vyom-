import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { onboardTenant } from '../server/auth';
import { Decimal } from '../domain/decimal';
import { Product, Customer, Address, ProductTaxClassification } from '../domain/types';

describe('Bill Vyom — Phase 5 Commercial Documents & Engine Test Suite', () => {
  let tenantId: string;
  let ownerId: string;
  let legalEntityId: string;
  let baseUomId: string;
  let productId: string;
  let customerId: string;

  before(() => {
    // 1. Onboard a fresh tenant
    const onboardResult = onboardTenant({
      legal_name: 'Commercial Operations Pvt Ltd',
      country_code: 'IN',
      base_currency_code: 'INR',
      timezone: 'Asia/Kolkata',
      business_type: 'Private Limited',
      industry: 'Wholesale & Distribution',
      contact_email: 'ops@commercial.com',
      contact_phone: '+919988776655',
      owner_first_name: 'Vijay',
      owner_last_name: 'Mallya',
      owner_email: `vijay_${Date.now()}@commercial.com`,
      owner_password: 'Password123!',
    });

    tenantId = onboardResult.tenant.id;
    ownerId = onboardResult.user.id;
    legalEntityId = db.getLegalEntitiesByTenant(tenantId)[0].id;

    // 2. Setup standard Base Unit of Measure (UOM)
    const now = new Date().toISOString();
    const uomGroupId = `uomg_${Date.now()}`;
    db.uomGroups.set(uomGroupId, {
      id: uomGroupId,
      tenant_id: tenantId,
      group_code: 'PCS',
      group_name: 'Pieces Group',
      measurement_type: 'COUNT',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    });

    baseUomId = `uom_${Date.now()}`;
    db.uoms.set(baseUomId, {
      id: baseUomId,
      tenant_id: tenantId,
      uom_group_id: uomGroupId,
      uom_code: 'UNIT',
      uom_name: 'Single Unit',
      symbol: 'U',
      decimal_places: 0,
      is_base: true,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    });

    // 3. Create a test product and its tax classification (so calculateTax works)
    productId = `prod_${Date.now()}`;
    const product: Product = {
      id: productId,
      tenant_id: tenantId,
      product_code: 'PROD-WIDGET-001',
      name: 'Super Commercial Widget',
      description: 'Test product for commercial documents testing',
      category_id: null,
      brand_name: 'ComBrand',
      product_type: 'GOODS',
      status: 'ACTIVE',
      base_uom_id: baseUomId,
      purchase_uom_id: baseUomId,
      sales_uom_id: baseUomId,
      inventory_uom_id: baseUomId,
      attributes: {},
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.products.set(productId, product);

    const taxId = `tc_${Date.now()}`;
    const taxClassif: ProductTaxClassification = {
      id: taxId,
      tenant_id: tenantId,
      product_id: productId,
      jurisdiction_code: 'IN',
      classification_system: 'HSN',
      classification_code: '8471',
      tax_category: 'STANDARD', // 18% Standard
      effective_from: now,
      effective_to: null,
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.productTaxClassifications.set(taxId, taxClassif);

    // 4. Create a test customer
    customerId = `cust_${Date.now()}`;
    const customer: Customer = {
      id: customerId,
      tenant_id: tenantId,
      customer_code: 'CUST-COM-01',
      customer_name: 'Global Enterprises Inc',
      legal_name: 'Global Enterprises Incorporated',
      customer_type: 'BUSINESS',
      customer_group_id: null,
      contact_email: 'billing@globalent.com',
      contact_phone: '+918888777766',
      country_code: 'IN',
      currency_code: 'INR',
      payment_terms_id: null,
      tax_registrations: [],
      status: 'ACTIVE',
      credit_config: {
        credit_limit: '150000.00',
        credit_days: 30,
        credit_status: 'APPROVED',
        payment_terms_id: null,
      },
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.customers.set(customerId, customer);
  });

  // ==========================================
  // SECTION 1: FULFILLMENT ENGINE TESTING
  // ==========================================
  test('Fulfillments: Partial fulfillment reduces remaining quantity & updates status', () => {
    const billingAddr: Address = {
      street_address: '123 Business Rd',
      city: 'Mumbai',
      state_province: 'MH',
      postal_code: '400001',
      country_code: 'IN',
    };

    // 1. Create a Sales Order for 10 units
    const order = db.createSalesOrder({
      tenant_id: tenantId,
      customer_id: customerId,
      legal_entity_id: legalEntityId,
      billing_address: billingAddr,
      shipping_address: billingAddr,
      lines: [
        {
          product_id: productId,
          quantity: 10,
          uom_id: baseUomId,
          unit_price: '500.00',
        },
      ],
      created_by: ownerId,
    });

    assert.strictEqual(order.status, 'CONFIRMED');
    const orderLine = order.lines[0];
    assert.strictEqual(orderLine.quantity_remaining, 10);
    assert.strictEqual(orderLine.quantity_fulfilled, 0);

    // 2. Perform partial fulfillment of 4 units
    const firstFul = db.createFulfillment({
      tenant_id: tenantId,
      sales_order_id: order.id,
      notes: 'First partial delivery',
      created_by: ownerId,
      lines: [
        {
          sales_order_line_id: orderLine.id,
          product_id: productId,
          quantity: 4,
          uom_id: baseUomId,
        },
      ],
    });

    // 3. Verify quantities and status change
    const updatedOrder = db.getSalesOrderById(tenantId, order.id)!;
    assert.strictEqual(updatedOrder.status, 'PARTIALLY_FULFILLED');
    assert.strictEqual(updatedOrder.lines[0].quantity_remaining, 6);
    assert.strictEqual(updatedOrder.lines[0].quantity_fulfilled, 4);

    // 4. Perform second partial fulfillment of 5 units (leaving 1 remaining)
    const secondFul = db.createFulfillment({
      tenant_id: tenantId,
      sales_order_id: order.id,
      notes: 'Second partial delivery',
      created_by: ownerId,
      lines: [
        {
          sales_order_line_id: orderLine.id,
          product_id: productId,
          quantity: 5,
          uom_id: baseUomId,
        },
      ],
    });

    const secondUpdatedOrder = db.getSalesOrderById(tenantId, order.id)!;
    assert.strictEqual(secondUpdatedOrder.status, 'PARTIALLY_FULFILLED');
    assert.strictEqual(secondUpdatedOrder.lines[0].quantity_remaining, 1);
    assert.strictEqual(secondUpdatedOrder.lines[0].quantity_fulfilled, 9);

    // 5. Verify error on over-fulfillment (attempting to fulfill 2 units when only 1 is remaining)
    assert.throws(() => {
      db.createFulfillment({
        tenant_id: tenantId,
        sales_order_id: order.id,
        created_by: ownerId,
        lines: [
          {
            sales_order_line_id: orderLine.id,
            product_id: productId,
            quantity: 2,
            uom_id: baseUomId,
          },
        ],
      });
    }, /exceeds remaining order line quantity/);

    // 6. Perform final fulfillment of 1 unit
    const thirdFul = db.createFulfillment({
      tenant_id: tenantId,
      sales_order_id: order.id,
      notes: 'Final delivery',
      created_by: ownerId,
      lines: [
        {
          sales_order_line_id: orderLine.id,
          product_id: productId,
          quantity: 1,
          uom_id: baseUomId,
        },
      ],
    });

    const finalizedOrder = db.getSalesOrderById(tenantId, order.id)!;
    assert.strictEqual(finalizedOrder.status, 'FULFILLED');
    assert.strictEqual(finalizedOrder.lines[0].quantity_remaining, 0);
    assert.strictEqual(finalizedOrder.lines[0].quantity_fulfilled, 10);

    // 7. Verify document relationships for all 3 fulfillments
    const relationships = Array.from(db.documentRelationships.values()).filter(
      (r) => r.tenant_id === tenantId && r.source_id === order.id && r.relation_type === 'FULFILLED_BY'
    );
    assert.strictEqual(relationships.length, 3);
    assert.strictEqual(relationships[0].target_type, 'DELIVERY');
  });

  // ==========================================
  // SECTION 2: CREDIT NOTE INTEGRITY
  // ==========================================
  test('Credit Notes: Post credit notes, check GL, and block over-crediting', () => {
    const addr: Address = {
      street_address: '123 Business Rd',
      city: 'Mumbai',
      state_province: 'MH',
      postal_code: '400001',
      country_code: 'IN',
    };

    // 1. Create and post an Invoice
    const invoiceDraft = db.createInvoiceDraft({
      tenant_id: tenantId,
      customer_id: customerId,
      legal_entity_id: legalEntityId,
      billing_address: addr,
      shipping_address: addr,
      lines: [
        {
          product_id: productId,
          quantity: 2,
          unit_price: '1000.00', // Subtotal: 2000. Tax: 360 (18%). Grand total: 2360
        },
      ],
      created_by: ownerId,
    });

    const postedInvoice = db.postInvoice(tenantId, invoiceDraft.id, ownerId);
    assert.strictEqual(postedInvoice.status, 'POSTED');
    assert.strictEqual(postedInvoice.grand_total, '2360.00');

    // 2. Create partial Credit Note Draft of 1180.00 (1 unit)
    const cnDraft = db.createCreditNoteDraft({
      tenant_id: tenantId,
      original_invoice_id: postedInvoice.id,
      reason: 'Partially defective goods returned',
      created_by: ownerId,
      lines: [
        {
          product_id: productId,
          quantity: 1,
          unit_price: '1000.00', // Net Credit: 1180.00 (subtotal 1000, tax 180)
        },
      ],
    });

    assert.strictEqual(cnDraft.status, 'DRAFT');
    assert.strictEqual(cnDraft.grand_total, '1180.00');

    // 3. Post Credit Note
    const issuedCN = db.postCreditNote(tenantId, cnDraft.id, ownerId);
    assert.strictEqual(issuedCN.status, 'ISSUED');
    assert.ok(issuedCN.posted_at);

    // 4. Attempt to create another credit note of 2 units (2360.00) which exceeds remaining eligible (1180.00)
    assert.throws(() => {
      db.createCreditNoteDraft({
        tenant_id: tenantId,
        original_invoice_id: postedInvoice.id,
        reason: 'Excess credit claim',
        created_by: ownerId,
        lines: [
          {
            product_id: productId,
            quantity: 2,
            unit_price: '1000.00',
          },
        ],
      });
    }, /exceeds remaining eligible invoice amount/);

    // 5. Verify general ledger entries for Issued Credit Note
    // Net credit is 1180. AR should be CREDITED (reduced) by 1180.00. Revenue DEBITED by 1000.00. Tax Payable DEBITED by 180.00.
    const journal = db.journalEntries.get(issuedCN.journal_entry_id!)!;
    assert.ok(journal);
    assert.strictEqual(journal.posted_by, ownerId);

    const arLine = journal.lines.find((l) => l.credit === '1180.00')!;
    const revLine = journal.lines.find((l) => l.debit === '1000.00')!;
    const taxLine = journal.lines.find((l) => l.debit === '180.00')!;

    assert.ok(arLine);
    assert.ok(revLine);
    assert.ok(taxLine);

    // 6. Verify reversal relation
    const relations = Array.from(db.documentRelationships.values()).filter(
      (r) => r.tenant_id === tenantId && r.source_id === issuedCN.id && r.relation_type === 'REVERSED_BY'
    );
    assert.strictEqual(relations.length, 1);
    assert.strictEqual(relations[0].target_id, postedInvoice.id);
  });

  // ==========================================
  // SECTION 3: DEBIT NOTE INTEGRITY
  // ==========================================
  test('Debit Notes: Post debit notes and verify balancing general ledger lines', () => {
    // Create and post Debit Note Draft
    const dnDraft = db.createDebitNoteDraft({
      tenant_id: tenantId,
      customer_id: customerId,
      legal_entity_id: legalEntityId,
      reason: 'Undercharged on pricing',
      created_by: ownerId,
      lines: [
        {
          product_id: productId,
          quantity: 1,
          unit_price: '200.00', // Subtotal 200, Tax 36 (18%), Grand 236
        },
      ],
    });

    assert.strictEqual(dnDraft.status, 'DRAFT');
    assert.strictEqual(dnDraft.grand_total, '236.00');

    // Post Debit Note
    const issuedDN = db.postDebitNote(tenantId, dnDraft.id, ownerId);
    assert.strictEqual(issuedDN.status, 'ISSUED');

    // Verify GL: AR DEBITED 236.00. Revenue CREDITED 200.00. Tax CREDITED 36.00.
    const journal = db.journalEntries.get(issuedDN.journal_entry_id!)!;
    assert.ok(journal);

    const arLine = journal.lines.find((l) => l.debit === '236.00')!;
    const revLine = journal.lines.find((l) => l.credit === '200.00')!;
    const taxLine = journal.lines.find((l) => l.credit === '36.00')!;

    assert.ok(arLine);
    assert.ok(revLine);
    assert.ok(taxLine);
  });

  // ==========================================
  // SECTION 4: SALES RETURNS ENGINE
  // ==========================================
  test('Sales Returns: Draft creation, approval status updates', () => {
    const retDraft = db.createSalesReturn({
      tenant_id: tenantId,
      customer_id: customerId,
      legal_entity_id: legalEntityId,
      notes: 'Customer returned overstock',
      created_by: ownerId,
      lines: [
        {
          product_id: productId,
          quantity: 5,
          uom_id: baseUomId,
          unit_price: '500.00',
          reason: 'Excess ordering',
        },
      ],
    });

    assert.strictEqual(retDraft.status, 'DRAFT');
    assert.strictEqual(retDraft.lines[0].quantity, 5);

    // Approve the return
    const approvedRet = db.approveSalesReturn(tenantId, retDraft.id, ownerId);
    assert.strictEqual(approvedRet.status, 'APPROVED');

    // Verify document history state
    const hist = db.getDocumentStatusHistoryByDocumentId(tenantId, approvedRet.id);
    assert.strictEqual(hist.length, 1);
    assert.strictEqual(hist[0].to_status, 'APPROVED');
    assert.strictEqual(hist[0].actor_id, ownerId);
  });

  // ==========================================
  // SECTION 5: SUPPORTING ENGINE CAPABILITIES
  // ==========================================
  test('Supporting: Immutability snapshots, history, attachments, and credit limit checks', () => {
    const addr: Address = {
      street_address: '123 Business Rd',
      city: 'Mumbai',
      state_province: 'MH',
      postal_code: '400001',
      country_code: 'IN',
    };

    // 1. Snapshot verification (use a real posted invoice)
    const testInvDraft = db.createInvoiceDraft({
      tenant_id: tenantId,
      customer_id: customerId,
      legal_entity_id: legalEntityId,
      billing_address: addr,
      shipping_address: addr,
      lines: [
        {
          product_id: productId,
          quantity: 1,
          unit_price: '500.00',
        },
      ],
      created_by: ownerId,
    });
    const testInvPosted = db.postInvoice(tenantId, testInvDraft.id, ownerId);

    const cn = db.createCreditNoteDraft({
      tenant_id: tenantId,
      original_invoice_id: testInvPosted.id,
      reason: 'Fake Test Note',
      created_by: ownerId,
      lines: [
        {
          product_id: productId,
          quantity: 1,
          unit_price: '500.00',
        },
      ],
    });
    const snap = db.getDocumentSnapshotByDocumentId(tenantId, cn.id);
    assert.ok(snap);
    assert.strictEqual(snap.customer_name_snapshot, 'Global Enterprises Inc');
    assert.strictEqual(snap.billing_address_snapshot.street_address, addr.street_address);

    // 2. File Attachments test
    const attachment = db.createDocumentAttachment({
      tenant_id: tenantId,
      document_type: 'FULFILLMENT',
      document_id: 'ful_test_attach',
      file_name: 'delivery_slip.pdf',
      file_path: '/uploads/delivery_slip.pdf',
      file_size: 154200,
      mime_type: 'application/pdf',
      uploaded_by: ownerId,
    });

    assert.ok(attachment.id);
    const retrievedAttachments = db.getDocumentAttachmentsByDocumentId(tenantId, 'ful_test_attach');
    assert.strictEqual(retrievedAttachments.length, 1);
    assert.strictEqual(retrievedAttachments[0].file_name, 'delivery_slip.pdf');
    assert.strictEqual(retrievedAttachments[0].file_size, 154200);

    // 3. Customer Credit Control evaluations
    // Limit is 150000.00
    const evalApproved = db.evaluateCustomerCredit(tenantId, customerId, '50000.00');
    assert.strictEqual(evalApproved, 'APPROVED');

    const evalBlocked = db.evaluateCustomerCredit(tenantId, customerId, '200000.00');
    assert.strictEqual(evalBlocked, 'BLOCKED');

    // Change status to SUSPENDED
    const customerObj = db.getCustomerById(tenantId, customerId)!;
    customerObj.credit_config.credit_status = 'SUSPENDED';
    db.customers.set(customerId, customerObj);

    const evalSuspended = db.evaluateCustomerCredit(tenantId, customerId, '10.00');
    assert.strictEqual(evalSuspended, 'BLOCKED');
  });
});
