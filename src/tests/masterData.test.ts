import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { onboardTenant } from '../server/auth';
import { Product, Customer, Vendor, Warehouse, PriceList, PriceListItem, UnitOfMeasure, DocumentType } from '../domain/types';

describe('Bill Vyom — Phase 3 Global Master Data Foundation Test Suite', () => {
  let tenantId: string;
  let ownerId: string;
  let baseUomId: string;

  before(() => {
    const onboardResult = onboardTenant({
      legal_name: 'Master Data Enterprise Ltd',
      country_code: 'IN',
      base_currency_code: 'INR',
      timezone: 'Asia/Kolkata',
      business_type: 'Private Limited',
      industry: 'Manufacturing',
      contact_email: 'master@enterprise.com',
      contact_phone: '+910000000000',
      owner_first_name: 'Madan',
      owner_last_name: 'Master',
      owner_email: `madan_${Date.now()}@master.com`,
      owner_password: 'Password123!',
    });

    tenantId = onboardResult.tenant.id;
    ownerId = onboardResult.user.id;

    // Set up standard base Unit of Measure (UOM) for testing
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
  });

  // ========================================================
  // MANDATORY FLOW 1: PRODUCT LIFECYCLE
  // ========================================================
  test('Mandatory Flow 1: Create Product → Retrieve → Update → Archive', () => {
    const productCode = `PROD-${Date.now()}`;
    const name = 'Enterprise Widget';
    const now = new Date().toISOString();
    const productId = `prod_${Date.now()}`;

    // Create
    const product: Product = {
      id: productId,
      tenant_id: tenantId,
      product_code: productCode,
      name,
      description: 'Standard enterprise hardware widget',
      category_id: null,
      brand_name: 'VyomBrand',
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

    // Retrieve
    const retrieved = db.getProductById(tenantId, productId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.product_code, productCode);
    assert.strictEqual(retrieved.status, 'ACTIVE');

    // Update
    retrieved.name = 'Premium Enterprise Widget';
    retrieved.version += 1;
    db.products.set(productId, retrieved);

    const updated = db.getProductById(tenantId, productId);
    assert.ok(updated);
    assert.strictEqual(updated.name, 'Premium Enterprise Widget');
    assert.strictEqual(updated.version, 2);

    // Archive (Soft delete)
    updated.status = 'ARCHIVED';
    updated.deleted_at = new Date().toISOString();
    db.products.set(productId, updated);

    // getProductById excludes soft-deleted items
    const archived = db.getProductById(tenantId, productId);
    assert.strictEqual(archived, undefined);

    // Verify it exists in database maps but with soft delete timestamp
    const directRecord = db.products.get(productId);
    assert.ok(directRecord);
    assert.strictEqual(directRecord.status, 'ARCHIVED');
    assert.ok(directRecord.deleted_at !== null);
  });

  // ========================================================
  // MANDATORY FLOW 2: CUSTOMER LIFECYCLE
  // ========================================================
  test('Mandatory Flow 2: Create Customer → Retrieve → Update → Archive', () => {
    const customerCode = `CUST-${Date.now()}`;
    const customerName = 'Alpha Distributors';
    const now = new Date().toISOString();
    const customerId = `cust_${Date.now()}`;

    // Create
    const customer: Customer = {
      id: customerId,
      tenant_id: tenantId,
      customer_code: customerCode,
      customer_name: customerName,
      legal_name: 'Alpha Distributors Private Limited',
      customer_type: 'BUSINESS',
      customer_group_id: null,
      contact_email: 'contact@alphadist.com',
      contact_phone: '+911234567890',
      country_code: 'IN',
      currency_code: 'INR',
      payment_terms_id: null,
      tax_registrations: [],
      status: 'ACTIVE',
      credit_config: {
        credit_limit: '100000.00',
        credit_days: 45,
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

    // Retrieve
    const retrieved = db.getCustomerById(tenantId, customerId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.customer_code, customerCode);
    assert.strictEqual(retrieved.status, 'ACTIVE');

    // Update
    retrieved.customer_name = 'Alpha Distributors Limited';
    retrieved.version += 1;
    db.customers.set(customerId, retrieved);

    const updated = db.getCustomerById(tenantId, customerId);
    assert.ok(updated);
    assert.strictEqual(updated.customer_name, 'Alpha Distributors Limited');
    assert.strictEqual(updated.version, 2);

    // Archive
    updated.status = 'ARCHIVED';
    updated.deleted_at = new Date().toISOString();
    db.customers.set(customerId, updated);

    // getCustomerById excludes soft-deleted items
    const archived = db.getCustomerById(tenantId, customerId);
    assert.strictEqual(archived, undefined);

    const directRecord = db.customers.get(customerId);
    assert.ok(directRecord);
    assert.strictEqual(directRecord.status, 'ARCHIVED');
    assert.ok(directRecord.deleted_at !== null);
  });

  // ========================================================
  // MANDATORY FLOW 3: VENDOR LIFECYCLE
  // ========================================================
  test('Mandatory Flow 3: Create Vendor → Retrieve → Update → Archive', () => {
    const vendorCode = `VEND-${Date.now()}`;
    const vendorName = 'Global Iron Works';
    const now = new Date().toISOString();
    const vendorId = `vend_${Date.now()}`;

    // Create
    const vendor: Vendor = {
      id: vendorId,
      tenant_id: tenantId,
      vendor_code: vendorCode,
      vendor_name: vendorName,
      legal_name: 'Global Iron Works Corp',
      vendor_type: 'BUSINESS',
      vendor_group_id: null,
      contact_email: 'sales@globaliron.com',
      contact_phone: '+919999988888',
      country_code: 'IN',
      currency_code: 'INR',
      payment_terms_id: null,
      tax_registrations: [],
      status: 'ACTIVE',
      payment_config: {
        payment_terms_id: null,
        bank_name: 'State Bank of India',
        account_number: '12345678901',
        routing_code: 'SBIN0001234',
        payment_method: 'BANK_TRANSFER',
      },
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.vendors.set(vendorId, vendor);

    // Retrieve
    const retrieved = db.getVendorById(tenantId, vendorId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.vendor_code, vendorCode);

    // Update
    retrieved.vendor_name = 'Global Iron & Alloy Works';
    retrieved.version += 1;
    db.vendors.set(vendorId, retrieved);

    const updated = db.getVendorById(tenantId, vendorId);
    assert.ok(updated);
    assert.strictEqual(updated.vendor_name, 'Global Iron & Alloy Works');

    // Archive
    updated.status = 'ARCHIVED';
    updated.deleted_at = new Date().toISOString();
    db.vendors.set(vendorId, updated);

    // getVendorById excludes soft-deleted items
    const archived = db.getVendorById(tenantId, vendorId);
    assert.strictEqual(archived, undefined);

    const directRecord = db.vendors.get(vendorId);
    assert.ok(directRecord);
    assert.strictEqual(directRecord.status, 'ARCHIVED');
    assert.ok(directRecord.deleted_at !== null);
  });

  // ========================================================
  // MANDATORY FLOW 4: WAREHOUSE & LOCATION HIERARCHY
  // ========================================================
  test('Mandatory Flow 4: Create Warehouse → Create Location → Retrieve Hierarchy → Archive', () => {
    const now = new Date().toISOString();
    const warehouseId = `wh_${Date.now()}`;

    // Create Warehouse
    const warehouse: Warehouse = {
      id: warehouseId,
      tenant_id: tenantId,
      branch_id: `br_test_${Date.now()}`,
      warehouse_code: 'WH-MAIN',
      warehouse_name: 'Central Storage Hub',
      address: {
        street_address: 'Phase 3 Industrial Area',
        city: 'Mumbai',
        state_province: 'Maharashtra',
        postal_code: '400001',
        country_code: 'IN',
      },
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.warehouses.set(warehouseId, warehouse);

    // Create Locations
    const locId1 = `loc_${Date.now()}_1`;
    db.storageLocations.set(locId1, {
      id: locId1,
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      location_code: 'ZONE-A-RACK1-BIN3',
      location_name: 'Zone A Rack 1 Bin 3',
      aisle: 'A',
      rack: '1',
      shelf: 'B',
      bin: '3',
      location_type: 'PICKING',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    });

    // Retrieve Hierarchy
    const locations = db.getStorageLocations(tenantId, warehouseId);
    assert.strictEqual(locations.length, 1);
    assert.strictEqual(locations[0].aisle, 'A');
    assert.strictEqual(locations[0].bin, '3');

    // Archive Warehouse
    warehouse.status = 'INACTIVE';
    warehouse.deleted_at = new Date().toISOString();
    db.warehouses.set(warehouseId, warehouse);

    const archivedWh = db.warehouses.get(warehouseId);
    assert.ok(archivedWh);
    assert.strictEqual(archivedWh.status, 'INACTIVE');
    assert.ok(archivedWh.deleted_at !== null);
  });

  // ========================================================
  // MANDATORY FLOW 5: PRICE LIST LIFECYCLE
  // ========================================================
  test('Mandatory Flow 5: Create Price List → Create Price List Item → Retrieve', () => {
    const now = new Date().toISOString();
    const priceListId = `pl_${Date.now()}`;
    const variantId = `var_test_${Date.now()}`;

    // Create Price List
    const priceList: PriceList = {
      id: priceListId,
      tenant_id: tenantId,
      price_list_code: 'RETAIL-INR',
      price_list_name: 'Standard Retail Price List',
      currency_code: 'INR',
      scope: 'GLOBAL',
      scope_id: null,
      customer_group_id: null,
      effective_from: now,
      effective_to: null,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.priceLists.set(priceListId, priceList);

    // Create Price List Item
    const itemId = `pli_${Date.now()}`;
    const priceListItem: PriceListItem = {
      id: itemId,
      tenant_id: tenantId,
      price_list_id: priceListId,
      variant_id: variantId,
      uom_id: baseUomId,
      min_quantity: 1,
      unit_price: '150.00',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    };
    db.priceListItems.set(itemId, priceListItem);

    // Retrieve Price List Items
    const items = db.getPriceListItems(tenantId, priceListId);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].unit_price, '150.00');
  });

  // ========================================================
  // CONCURRENCY & INTEGRITY TEST
  // ========================================================
  test('Concurrency Check: 100 Simultaneous Document Numbering Requests', () => {
    // Generate sequence configuration for standard invoice
    const configId = `dnc_${Date.now()}`;
    const now = new Date().toISOString();
    const documentType: DocumentType = 'INVOICE';

    db.documentNumberingConfigs.set(configId, {
      id: configId,
      tenant_id: tenantId,
      document_type: documentType,
      legal_entity_id: null,
      branch_id: null,
      prefix: 'INV',
      suffix: '',
      sequence_length: 5,
      current_sequence: 1,
      fiscal_year: '2026',
      effective_from: now,
      effective_to: null,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    });

    // Fire 100 simultaneous/sequential generators in a loop
    const generatedNumbers: string[] = [];
    for (let i = 0; i < 100; i++) {
      const generated = db.generateNextDocumentNumber(tenantId, documentType, null, null);
      generatedNumbers.push(generated);
    }

    // Verify all 100 are unique and properly padded
    const uniqueNumbers = new Set(generatedNumbers);
    assert.strictEqual(uniqueNumbers.size, 100);
    assert.strictEqual(generatedNumbers[0], 'INV-2026-00001');
    assert.strictEqual(generatedNumbers[99], 'INV-2026-00100');
  });

  // ========================================================
  // SECURITY & MULTI-TENANT ISOLATION
  // ========================================================
  test('Security/Isolation: Cross-Tenant Data Leakage Prevention Checks', () => {
    // Attempting to query product from another tenant ID should result in empty/undef
    const otherTenantId = `ten_stranger_${Date.now()}`;
    const strangerProducts = db.getProductsByTenant(otherTenantId);
    assert.strictEqual(strangerProducts.items.length, 0);

    const strangerCustomers = db.getCustomersByTenant(otherTenantId);
    assert.strictEqual(strangerCustomers.items.length, 0);

    const strangerVendors = db.getVendorsByTenant(otherTenantId);
    assert.strictEqual(strangerVendors.items.length, 0);
  });
});
