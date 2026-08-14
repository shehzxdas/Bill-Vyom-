import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { onboardTenant } from '../server/auth';
import { Decimal } from '../domain/decimal';
import { POSService } from '../server/services/posService';
import { InventoryService } from '../server/services/inventoryService';

describe('Bill Vyom — Phase 9 Global POS & Omnichannel Sales Test Suite', () => {
  let tenantId: string;
  let ownerId: string;
  let legalEntityId: string;
  let branchId: string;
  let warehouseId: string;
  let posService: POSService;
  let inventoryService: InventoryService;

  let productId1: string;
  let productId2: string;
  let terminalId: string;
  let customerId: string;

  before(() => {
    posService = POSService.getInstance();
    inventoryService = InventoryService.getInstance();

    // 1. Onboard Tenant
    const res = onboardTenant({
      legal_name: 'Apex Supermart Retail Ltd',
      country_code: 'IN',
      base_currency_code: 'INR',
      timezone: 'Asia/Kolkata',
      business_type: 'Private Limited',
      industry: 'Supermarket / Retail',
      contact_email: 'pos@apexretail.com',
      contact_phone: '+919876543299',
      owner_first_name: 'Vikram',
      owner_last_name: 'Malhotra',
      owner_email: `vikram_${Date.now()}@apexretail.com`,
      owner_password: 'Password123!',
    });
    tenantId = res.tenant.id;
    ownerId = res.user.id;

    const le = db.getLegalEntitiesByTenant(tenantId)[0];
    legalEntityId = le.id;

    // Create branch & warehouse
    const now = new Date().toISOString();
    branchId = `br_${Date.now()}`;
    db.branches.set(branchId, {
      id: branchId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      branch_code: 'BR-MUM-01',
      branch_name: 'Mumbai Flagship Store',
      branch_type: 'RETAIL_STORE',
      status: 'ACTIVE',
      currency: 'INR',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    } as any);

    warehouseId = `wh_${Date.now()}`;
    db.warehouses.set(warehouseId, {
      id: warehouseId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      branch_id: branchId,
      warehouse_code: 'WH-STORE-01',
      warehouse_name: 'Store Front Warehouse',
      warehouse_type: 'RETAIL',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    } as any);

    // Create Customer
    customerId = `cust_${Date.now()}`;
    db.customers.set(customerId, {
      id: customerId,
      tenant_id: tenantId,
      customer_code: 'CUST-001',
      customer_name: 'Rahul Verma',
      legal_name: 'Rahul Verma',
      customer_type: 'INDIVIDUAL',
      status: 'ACTIVE',
      currency_code: 'INR',
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    } as any);

    // Create Products
    productId1 = `prod_coffee_${Date.now()}`;
    db.products.set(productId1, {
      id: productId1,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      sku: 'SKU-COFFEE-500G',
      product_code: 'SKU-COFFEE-500G',
      product_name: 'Artisan Dark Roast Coffee 500g',
      name: 'Artisan Dark Roast Coffee 500g',
      status: 'ACTIVE',
      product_type: 'GOODS',
      base_price: '450.00',
      selling_price: '450.00',
      cost_price: '280.00',
      standard_tax_rate: 18,
      inventory_tracked: true,
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    } as any);

    productId2 = `prod_mug_${Date.now()}`;
    db.products.set(productId2, {
      id: productId2,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      sku: 'SKU-MUG-CERAMIC',
      product_code: 'SKU-MUG-CERAMIC',
      product_name: 'Nordic Ceramic Coffee Mug',
      name: 'Nordic Ceramic Coffee Mug',
      status: 'ACTIVE',
      product_type: 'GOODS',
      base_price: '200.00',
      selling_price: '200.00',
      cost_price: '90.00',
      standard_tax_rate: 12,
      inventory_tracked: true,
      created_at: now,
      updated_at: now,
      created_by: ownerId,
      updated_by: ownerId,
      deleted_at: null,
      version: 1,
    } as any);

    // Receive initial stock into warehouse
    inventoryService.recordInventoryMovement({
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      warehouse_id: warehouseId,
      product_id: productId1,
      movement_type: 'RECEIPT',
      quantity: 100,
      unit_cost: '280.00',
      source_type: 'PURCHASE_RECEIPT',
      source_id: 'PR-INIT-01',
      created_by: ownerId,
    });

    inventoryService.recordInventoryMovement({
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      warehouse_id: warehouseId,
      product_id: productId2,
      movement_type: 'RECEIPT',
      quantity: 50,
      unit_cost: '90.00',
      source_type: 'PURCHASE_RECEIPT',
      source_id: 'PR-INIT-02',
      created_by: ownerId,
    });
  });

  test('1. Create POS Terminal and verify configuration', () => {
    const terminal = posService.createTerminal(
      tenantId,
      {
        legal_entity_id: legalEntityId,
        branch_id: branchId,
        warehouse_id: warehouseId,
        terminal_code: 'POS-FRONT-01',
        terminal_name: 'Counter 1 Main Lane',
        hardware_config: {
          receipt_printer_enabled: true,
          receipt_printer_type: 'THERMAL',
          barcode_scanner_enabled: true,
        },
      },
      ownerId
    );

    assert.ok(terminal.id);
    assert.strictEqual(terminal.terminal_code, 'POS-FRONT-01');
    assert.strictEqual(terminal.status, 'ACTIVE');
    terminalId = terminal.id;
  });

  test('2. Open Shift Session with Float & Record Paid In / Paid Out', () => {
    const session = posService.openSession(
      tenantId,
      {
        legal_entity_id: legalEntityId,
        branch_id: branchId,
        warehouse_id: warehouseId,
        terminal_id: terminalId,
        opening_float: '1000.00',
        opening_notes: 'Initial 10x100 INR notes float',
      },
      ownerId
    );

    assert.ok(session.id);
    assert.strictEqual(session.status, 'OPEN');
    assert.strictEqual(session.opening_float, '1000.00');
    assert.strictEqual(session.expected_cash, '1000.00');

    // Record Paid Out (e.g. store cleaning supplies)
    const paidOut = posService.recordCashMovement(
      tenantId,
      session.id,
      'PAID_OUT',
      '150.00',
      'Store cleaning supplies',
      ownerId
    );
    assert.strictEqual(paidOut.amount, '150.00');

    // Expected cash is now 1000 - 150 = 850
    const updatedSession = posService.getActiveSession(tenantId, terminalId);
    assert.strictEqual(updatedSession?.expected_cash, '850.00');
  });

  test('3. Cart Operations: Add Items, Discounts, Taxes, Hold & Resume', () => {
    const activeSession = posService.getActiveSession(tenantId, terminalId);
    assert.ok(activeSession);

    const cart = posService.getOrCreateCart(tenantId, activeSession.id, ownerId);
    assert.ok(cart);

    // Add Coffee (Qty 2)
    const updatedCart1 = posService.addItemToCart(tenantId, cart.id, {
      product_id: productId1,
      quantity: 2,
    });
    assert.strictEqual(updatedCart1.items.length, 1);
    assert.strictEqual(updatedCart1.items[0].quantity, 2);

    // Add Ceramic Mug (Qty 1) with 10% discount
    const updatedCart2 = posService.addItemToCart(tenantId, cart.id, {
      product_id: productId2,
      quantity: 1,
      discount_type: 'PERCENT',
      discount_value: '10',
    });
    assert.strictEqual(updatedCart2.items.length, 2);

    // Verify subtotal, discount, tax, grand total
    // Coffee: 2 * 450 = 900. Tax (18%): 162.00. Total = 1062.00
    // Mug: 1 * 200 = 200. Disc (10%): 20. Net = 180. Tax (12%): 21.60. Total = 201.60
    // Grand Total: 1062.00 + 201.60 = 1263.60
    assert.strictEqual(updatedCart2.subtotal, '1100.00');
    assert.strictEqual(updatedCart2.discount_total, '20.00');
    assert.strictEqual(updatedCart2.tax_total, '183.60');
    assert.strictEqual(updatedCart2.grand_total, '1263.60');

    // Test Hold Sale
    const heldCart = posService.holdSale(tenantId, cart.id, 'Customer stepped away for wallet', 'Mr. Rahul', ownerId);
    assert.strictEqual(heldCart.cart_status, 'HELD');

    const heldList = posService.getHeldSales(tenantId, branchId);
    assert.strictEqual(heldList.length, 1);
    assert.strictEqual(heldList[0].id, heldCart.id);

    // Test Resume Sale
    const resumedCart = posService.resumeHeldSale(tenantId, heldCart.id, ownerId);
    assert.strictEqual(resumedCart.cart_status, 'OPEN');
    assert.strictEqual(resumedCart.grand_total, '1263.60');
  });

  test('4. Server-Authoritative Checkout with Split Payments and Double-Entry GL Verification', () => {
    const activeSession = posService.getActiveSession(tenantId, terminalId);
    assert.ok(activeSession);
    const cart = posService.getOrCreateCart(tenantId, activeSession.id, ownerId);

    // Split Payment: 600 Cash + 663.60 Card = 1263.60
    const checkoutResult = posService.checkout(
      tenantId,
      {
        cart_id: cart.id,
        customer_id: customerId,
        payments: [
          {
            payment_method: 'CASH',
            amount: '600.00',
            tendered_amount: '1000.00', // Change = 400.00
          },
          {
            payment_method: 'CARD',
            amount: '663.60',
            tendered_amount: '663.60',
            reference_number: 'TXN-CARD-99128',
          },
        ],
      },
      ownerId
    );

    assert.ok(checkoutResult.transaction);
    assert.strictEqual(checkoutResult.transaction.status, 'COMPLETED');
    assert.strictEqual(checkoutResult.transaction.grand_total, '1263.60');
    assert.strictEqual(checkoutResult.receipt.receipt_number.startsWith('REC-'), true);

    // Check inventory reduction
    const stockCoffee = inventoryService.getStockBalance(tenantId, warehouseId, productId1)?.on_hand_quantity;
    assert.strictEqual(stockCoffee, 98); // 100 - 2

    const stockMug = inventoryService.getStockBalance(tenantId, warehouseId, productId2)?.on_hand_quantity;
    assert.strictEqual(stockMug, 49); // 50 - 1

    // Check Drawer expected cash updated (+600 cash sale): 850 + 600 = 1450
    const currentSession = posService.getActiveSession(tenantId, terminalId);
    assert.strictEqual(currentSession?.expected_cash, '1450.00');
  });

  test('5. Process POS Return & Inventory Routing with Refund', () => {
    const transactions = posService.getTransactions(tenantId, branchId);
    assert.ok(transactions.length > 0);
    const tx = transactions[0];

    const mugLine = tx.lines.find((l: any) => l.product_id === productId2);
    assert.ok(mugLine);

    // Return 1 mug due to defect -> route to DAMAGED
    const posReturn = posService.processReturn(
      tenantId,
      {
        original_transaction_id: tx.id,
        return_reason: 'Ceramic handle chipped',
        condition: 'DAMAGED',
        target_inventory_status: 'DAMAGED',
        refund_method: 'CASH',
        lines: [
          {
            original_line_id: mugLine.id,
            quantity_returned: 1,
            condition: 'DAMAGED',
          },
        ],
      },
      ownerId
    );

    assert.ok(posReturn.id);
    assert.strictEqual(posReturn.status, 'COMPLETED');
    assert.strictEqual(posReturn.refund_total, '201.60');

    // Expected cash updated (-201.60): 1450 - 201.60 = 1248.40
    const currentSession = posService.getActiveSession(tenantId, terminalId);
    assert.strictEqual(currentSession?.expected_cash, '1248.40');
  });

  test('6. Close Shift Session with Cash Drawer Reconciliation & Variance', () => {
    const activeSession = posService.getActiveSession(tenantId, terminalId);
    assert.ok(activeSession);

    // Cashier counts 1250.00 in drawer (Variance = +1.60)
    const closedSession = posService.closeSession(
      tenantId,
      activeSession.id,
      '1250.00',
      'Counted 2x500 + 2x100 + 1x50 notes',
      ownerId
    );

    assert.strictEqual(closedSession.status, 'CLOSED');
    assert.strictEqual(closedSession.counted_cash, '1250.00');
    assert.strictEqual(closedSession.cash_variance, '1.60');
  });

  test('7. Multi-Domain Sales Reconciliation Run', () => {
    const run = posService.runSalesReconciliation(
      tenantId,
      legalEntityId,
      branchId,
      terminalId,
      undefined,
      ownerId
    );

    assert.ok(run.id);
    assert.strictEqual(run.status, 'RECONCILED');
    assert.strictEqual(run.pos_sales_total, '1263.60');
    assert.strictEqual(run.sales_order_domain_total, '1263.60');
    assert.strictEqual(run.variance_sales, '0.00');
  });
});
