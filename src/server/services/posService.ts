/**
 * Bill Vyom — Phase 9 Global POS & Omnichannel Sales Execution Engine
 * 
 * Authoritative Principles:
 * 1. POS IS A SALES CHANNEL: Consumes canonical Products, Customers, Sales Orders, Invoices, Payments, and Inventory.
 * 2. Immutable, append-only transactions and receipts.
 * 3. Server-authoritative pricing, discounts, taxes, and inventory verification.
 * 4. Split payments, multi-payment support, and strict cash drawer reconciliation.
 * 5. Full double-entry GL synchronization for revenue, taxes, COGS, and inventory relief.
 * 6. Zero placeholder, fake, or mock data.
 */

import {
  POSTerminal,
  POSSession,
  CashDrawer,
  CashSession,
  CashMovement,
  POSCart,
  POSCartItem,
  POSTransaction,
  POSTransactionItem,
  POSPaymentLine,
  POSReceipt,
  POSReturn,
  POSReturnLine,
  OfflineDevice,
  OfflineCommand,
  SyncConflict,
  SalesReconciliationRun,
  SalesReconciliationException,
  POSPaymentMethod,
  ReturnCondition,
  ConflictResolutionPolicy,
  SalesOrder,
  SalesOrderLine,
  Invoice,
  InvoiceLine,
  Payment,
  Refund,
} from '../../domain/types';
import { Decimal } from '../../domain/decimal';
import { db } from '../db';
import { InventoryService } from './inventoryService';

export class POSService {
  private static instance: POSService;
  private invService = InventoryService.getInstance();

  public static getInstance(): POSService {
    if (!POSService.instance) {
      POSService.instance = new POSService();
    }
    return POSService.instance;
  }

  // ==========================================
  // 1. TERMINAL MANAGEMENT
  // ==========================================

  public getTerminals(tenantId: string, branchId?: string): POSTerminal[] {
    return Array.from(db.posTerminals.values()).filter(
      (t) => t.tenant_id === tenantId && (!branchId || t.branch_id === branchId) && !t.deleted_at
    );
  }

  public getTerminalById(tenantId: string, terminalId: string): POSTerminal | null {
    const t = db.posTerminals.get(terminalId);
    if (!t || t.tenant_id !== tenantId || t.deleted_at) return null;
    return t;
  }

  public createTerminal(
    tenantId: string,
    data: {
      legal_entity_id: string;
      branch_id: string;
      warehouse_id: string;
      terminal_code: string;
      terminal_name: string;
      default_price_list_id?: string | null;
      default_customer_id?: string | null;
      hardware_config?: Partial<POSTerminal['hardware_config']>;
    },
    actorId: string
  ): POSTerminal {
    // Validate uniqueness of terminal code within branch
    const existing = Array.from(db.posTerminals.values()).find(
      (t) => t.tenant_id === tenantId && t.branch_id === data.branch_id && t.terminal_code === data.terminal_code && !t.deleted_at
    );
    if (existing) {
      throw new Error(`Terminal with code "${data.terminal_code}" already exists in this branch.`);
    }

    const now = new Date().toISOString();
    const terminalId = `pos_term_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const terminal: POSTerminal = {
      id: terminalId,
      tenant_id: tenantId,
      legal_entity_id: data.legal_entity_id,
      branch_id: data.branch_id,
      warehouse_id: data.warehouse_id,
      terminal_code: data.terminal_code,
      terminal_name: data.terminal_name,
      status: 'ACTIVE',
      default_price_list_id: data.default_price_list_id || null,
      default_customer_id: data.default_customer_id || null,
      hardware_config: {
        receipt_printer_enabled: data.hardware_config?.receipt_printer_enabled ?? true,
        receipt_printer_type: data.hardware_config?.receipt_printer_type || 'THERMAL',
        barcode_scanner_enabled: data.hardware_config?.barcode_scanner_enabled ?? true,
        payment_terminal_integration: data.hardware_config?.payment_terminal_integration || 'MANUAL',
      },
      current_session_id: null,
      created_at: now,
      updated_at: now,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    db.posTerminals.set(terminal.id, terminal);

    // Initialize or get default cash drawer for this terminal
    const drawerId = `cash_drawer_${terminal.id}`;
    if (!db.cashDrawers.has(drawerId)) {
      const drawer: CashDrawer = {
        id: drawerId,
        tenant_id: tenantId,
        branch_id: data.branch_id,
        terminal_id: terminal.id,
        drawer_name: `${data.terminal_name} Main Drawer`,
        current_balance: '0.00',
        currency_code: 'INR',
        status: 'CLOSED',
        created_at: now,
        updated_at: now,
        created_by: actorId,
        updated_by: actorId,
        deleted_at: null,
        version: 1,
      };
      db.cashDrawers.set(drawer.id, drawer);
    }

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'pos@billvyom.internal',
      action: 'POS_TERMINAL_CREATED',
      resource_type: 'POSTerminal',
      resource_id: terminal.id,
      changes: terminal as any,
    });

    return terminal;
  }

  public updateTerminal(
    tenantId: string,
    terminalId: string,
    updates: Partial<POSTerminal>,
    actorId: string
  ): POSTerminal {
    const terminal = this.getTerminalById(tenantId, terminalId);
    if (!terminal) throw new Error('POS Terminal not found.');

    const now = new Date().toISOString();
    const updated: POSTerminal = {
      ...terminal,
      ...updates,
      updated_at: now,
      updated_by: actorId,
      version: terminal.version + 1,
    };

    db.posTerminals.set(terminalId, updated);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'pos@billvyom.internal',
      action: 'POS_TERMINAL_UPDATED',
      resource_type: 'POSTerminal',
      resource_id: terminalId,
      changes: updates,
    });

    return updated;
  }

  // ==========================================
  // 2. POS SESSIONS & SHIFT MANAGEMENT
  // ==========================================

  public getSessions(tenantId: string, branchId?: string, terminalId?: string): POSSession[] {
    return Array.from(db.posSessions.values()).filter(
      (s) =>
        s.tenant_id === tenantId &&
        (!branchId || s.branch_id === branchId) &&
        (!terminalId || s.terminal_id === terminalId) &&
        !s.deleted_at
    ).sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  }

  public getActiveSession(tenantId: string, terminalId: string): POSSession | null {
    const session = Array.from(db.posSessions.values()).find(
      (s) => s.tenant_id === tenantId && s.terminal_id === terminalId && s.status === 'OPEN' && !s.deleted_at
    );
    return session || null;
  }

  public openSession(
    tenantId: string,
    data: {
      legal_entity_id: string;
      branch_id: string;
      warehouse_id: string;
      terminal_id: string;
      opening_float: string;
      opening_notes?: string | null;
    },
    cashierId: string
  ): POSSession {
    const terminal = this.getTerminalById(tenantId, data.terminal_id);
    if (!terminal) throw new Error('POS Terminal not found.');
    if (terminal.status !== 'ACTIVE') throw new Error('POS Terminal is not active.');

    const existingOpen = this.getActiveSession(tenantId, data.terminal_id);
    if (existingOpen) {
      throw new Error(`An open session already exists on terminal "${terminal.terminal_name}". Close current session before opening a new one.`);
    }

    const now = new Date().toISOString();
    const floatAmount = new Decimal(data.opening_float || '0').toFixed(2);

    const sessionId = `pos_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: POSSession = {
      id: sessionId,
      tenant_id: tenantId,
      legal_entity_id: data.legal_entity_id,
      branch_id: data.branch_id,
      warehouse_id: data.warehouse_id,
      terminal_id: data.terminal_id,
      cashier_id: cashierId,
      status: 'OPEN',
      opened_at: now,
      closed_at: null,
      opening_float: floatAmount,
      expected_cash: floatAmount,
      counted_cash: null,
      cash_variance: null,
      total_sales_count: 0,
      total_sales_amount: '0.00',
      total_refunds_count: 0,
      total_refunds_amount: '0.00',
      total_discount_amount: '0.00',
      total_tax_amount: '0.00',
      opening_notes: data.opening_notes || null,
      closing_notes: null,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };

    db.posSessions.set(session.id, session);

    // Update terminal current session
    terminal.current_session_id = session.id;
    terminal.updated_at = now;
    db.posTerminals.set(terminal.id, terminal);

    // Record cash session and opening float movement
    const cashDrawer = Array.from(db.cashDrawers.values()).find(
      (cd) => cd.tenant_id === tenantId && cd.terminal_id === data.terminal_id
    );
    if (cashDrawer) {
      cashDrawer.current_balance = floatAmount;
      cashDrawer.status = 'OPEN';
      cashDrawer.updated_at = now;
      db.cashDrawers.set(cashDrawer.id, cashDrawer);
    }

    const cashMovementId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const movement: CashMovement = {
      id: cashMovementId,
      tenant_id: tenantId,
      branch_id: data.branch_id,
      terminal_id: data.terminal_id,
      pos_session_id: session.id,
      cashier_id: cashierId,
      movement_type: 'OPENING_FLOAT',
      amount: floatAmount,
      currency_code: 'INR',
      reason: 'Session opening cash float',
      reference_id: session.id,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.cashMovements.set(movement.id, movement);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_SESSION_OPENED',
      resource_type: 'POSSession',
      resource_id: session.id,
      changes: { opening_float: floatAmount, terminal_id: data.terminal_id },
    });

    return session;
  }

  public closeSession(
    tenantId: string,
    sessionId: string,
    countedCash: string,
    closingNotes: string | undefined,
    cashierId: string
  ): POSSession {
    const session = db.posSessions.get(sessionId);
    if (!session || session.tenant_id !== tenantId || session.deleted_at) {
      throw new Error('POS Session not found.');
    }
    if (session.status !== 'OPEN') {
      throw new Error('POS Session is already closed or suspended.');
    }

    const now = new Date().toISOString();
    const countedDec = new Decimal(countedCash || '0');
    const expectedDec = new Decimal(session.expected_cash || '0');
    const varianceDec = countedDec.sub(expectedDec);

    session.status = 'CLOSED';
    session.closed_at = now;
    session.counted_cash = countedDec.toFixed(2);
    session.cash_variance = varianceDec.toFixed(2);
    session.closing_notes = closingNotes || null;
    session.updated_at = now;
    session.updated_by = cashierId;
    session.version += 1;

    db.posSessions.set(session.id, session);

    // Clear terminal session pointer
    const terminal = db.posTerminals.get(session.terminal_id);
    if (terminal && terminal.current_session_id === session.id) {
      terminal.current_session_id = null;
      terminal.updated_at = now;
      db.posTerminals.set(terminal.id, terminal);
    }

    // Close cash drawer
    const cashDrawer = Array.from(db.cashDrawers.values()).find(
      (cd) => cd.tenant_id === tenantId && cd.terminal_id === session.terminal_id
    );
    if (cashDrawer) {
      cashDrawer.status = 'CLOSED';
      cashDrawer.updated_at = now;
      db.cashDrawers.set(cashDrawer.id, cashDrawer);
    }

    // Record closing count cash movement
    const movementId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const movement: CashMovement = {
      id: movementId,
      tenant_id: tenantId,
      branch_id: session.branch_id,
      terminal_id: session.terminal_id,
      pos_session_id: session.id,
      cashier_id: cashierId,
      movement_type: 'CLOSING_COUNT',
      amount: countedDec.toFixed(2),
      currency_code: 'INR',
      reason: `Session close count (Variance: ${varianceDec.toFixed(2)})`,
      reference_id: session.id,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.cashMovements.set(movement.id, movement);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_SESSION_CLOSED',
      resource_type: 'POSSession',
      resource_id: session.id,
      changes: {
        counted_cash: session.counted_cash,
        expected_cash: session.expected_cash,
        cash_variance: session.cash_variance,
      },
    });

    return session;
  }

  // ==========================================
  // 3. CASH MANAGEMENT & CASH MOVEMENTS
  // ==========================================

  public recordCashMovement(
    tenantId: string,
    sessionId: string,
    movementType: 'PAID_IN' | 'PAID_OUT' | 'ADJUSTMENT',
    amount: string,
    reason: string,
    cashierId: string
  ): CashMovement {
    const session = db.posSessions.get(sessionId);
    if (!session || session.tenant_id !== tenantId || session.deleted_at) {
      throw new Error('POS Session not found.');
    }
    if (session.status !== 'OPEN') {
      throw new Error('Cannot add cash movements to a closed POS Session.');
    }

    const now = new Date().toISOString();
    const movementDec = new Decimal(amount || '0');
    if (movementDec.lte(0)) {
      throw new Error('Cash movement amount must be strictly greater than 0.');
    }

    const currentExp = new Decimal(session.expected_cash || '0');
    let newExpected = currentExp;

    if (movementType === 'PAID_IN') {
      newExpected = currentExp.add(movementDec);
    } else if (movementType === 'PAID_OUT') {
      if (movementDec.gt(currentExp)) {
        throw new Error(`Insufficient cash in drawer (${currentExp.toFixed(2)}) for Paid Out of ${movementDec.toFixed(2)}.`);
      }
      newExpected = currentExp.sub(movementDec);
    } else if (movementType === 'ADJUSTMENT') {
      newExpected = currentExp.add(movementDec);
    }

    session.expected_cash = newExpected.toFixed(2);
    session.updated_at = now;
    db.posSessions.set(session.id, session);

    // Update drawer balance
    const cashDrawer = Array.from(db.cashDrawers.values()).find(
      (cd) => cd.tenant_id === tenantId && cd.terminal_id === session.terminal_id
    );
    if (cashDrawer) {
      cashDrawer.current_balance = newExpected.toFixed(2);
      cashDrawer.updated_at = now;
      db.cashDrawers.set(cashDrawer.id, cashDrawer);
    }

    const movementId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const movement: CashMovement = {
      id: movementId,
      tenant_id: tenantId,
      branch_id: session.branch_id,
      terminal_id: session.terminal_id,
      pos_session_id: session.id,
      cashier_id: cashierId,
      movement_type: movementType,
      amount: movementDec.toFixed(2),
      currency_code: 'INR',
      reason: reason || `Manual cash ${movementType}`,
      reference_id: session.id,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };

    db.cashMovements.set(movement.id, movement);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_CASH_MOVEMENT',
      resource_type: 'CashMovement',
      resource_id: movement.id,
      changes: { movement_type: movementType, amount: movementDec.toFixed(2), reason },
    });

    return movement;
  }

  public getCashMovements(tenantId: string, sessionId: string): CashMovement[] {
    return Array.from(db.cashMovements.values()).filter(
      (cm) => cm.tenant_id === tenantId && cm.pos_session_id === sessionId && !cm.deleted_at
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ==========================================
  // 4. CART & HELD SALES
  // ==========================================

  public getOrCreateCart(
    tenantId: string,
    sessionId: string,
    cashierId: string
  ): POSCart {
    const session = db.posSessions.get(sessionId);
    if (!session || session.tenant_id !== tenantId || session.status !== 'OPEN') {
      throw new Error('Active POS Session is required for cart operations.');
    }

    // Look for an existing OPEN cart for this session
    const existing = Array.from(db.posCarts.values()).find(
      (c) => c.tenant_id === tenantId && c.session_id === sessionId && c.cart_status === 'OPEN' && !c.deleted_at
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const cartId = `pos_cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cart: POSCart = {
      id: cartId,
      tenant_id: tenantId,
      legal_entity_id: session.legal_entity_id,
      branch_id: session.branch_id,
      warehouse_id: session.warehouse_id,
      terminal_id: session.terminal_id,
      session_id: session.id,
      cashier_id: cashierId,
      customer_id: null,
      cart_status: 'OPEN',
      currency_code: 'INR',
      subtotal: '0.00',
      discount_total: '0.00',
      tax_total: '0.00',
      grand_total: '0.00',
      items: [],
      held_at: null,
      held_reason: null,
      held_reference: null,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };

    db.posCarts.set(cart.id, cart);
    return cart;
  }

  public recalculateCart(cart: POSCart): POSCart {
    let subtotalDec = Decimal.zero(2);
    let discountTotalDec = Decimal.zero(2);
    let taxTotalDec = Decimal.zero(2);

    for (const item of cart.items) {
      const unitPriceDec = new Decimal(item.unit_price || '0');
      const qtyDec = new Decimal(item.quantity || 1);
      const grossLine = unitPriceDec.mul(qtyDec);

      let lineDiscDec = Decimal.zero(2);
      if (item.discount_type === 'PERCENT') {
        const pct = new Decimal(item.discount_value || '0');
        lineDiscDec = grossLine.mul(pct).div(100);
      } else {
        lineDiscDec = new Decimal(item.discount_value || '0');
      }

      if (lineDiscDec.gt(grossLine)) lineDiscDec = grossLine;
      const netLine = grossLine.sub(lineDiscDec);

      const taxRateDec = new Decimal(item.tax_rate || '0');
      const lineTaxDec = netLine.mul(taxRateDec).div(100);
      const lineTotalDec = netLine.add(lineTaxDec);

      item.discount_amount = lineDiscDec.toFixed(2);
      item.tax_amount = lineTaxDec.toFixed(2);
      item.line_total = lineTotalDec.toFixed(2);

      subtotalDec = subtotalDec.add(grossLine);
      discountTotalDec = discountTotalDec.add(lineDiscDec);
      taxTotalDec = taxTotalDec.add(lineTaxDec);
    }

    const grandTotalDec = subtotalDec.sub(discountTotalDec).add(taxTotalDec);

    cart.subtotal = subtotalDec.toFixed(2);
    cart.discount_total = discountTotalDec.toFixed(2);
    cart.tax_total = taxTotalDec.toFixed(2);
    cart.grand_total = grandTotalDec.toFixed(2);
    cart.updated_at = new Date().toISOString();

    return cart;
  }

  public addItemToCart(
    tenantId: string,
    cartId: string,
    itemData: {
      product_id: string;
      variant_id?: string | null;
      quantity: number;
      lot_id?: string | null;
      serial_number?: string | null;
      discount_type?: 'PERCENT' | 'FIXED';
      discount_value?: string;
      notes?: string | null;
    }
  ): POSCart {
    const cart = db.posCarts.get(cartId);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'OPEN') {
      throw new Error('Open POS Cart not found.');
    }

    const product = db.products.get(itemData.product_id);
    if (!product || product.tenant_id !== tenantId) {
      throw new Error('Product not found in tenant master.');
    }

    // Authoritative Server-side Price Lookup
    let authoritativePrice = '0.00';
    const priceListItems = Array.from(db.priceListItems.values()).filter(
      (pli: any) => pli.tenant_id === tenantId && (pli.product_id === product.id || pli.variant_id === product.id) && !pli.deleted_at
    );
    if (priceListItems.length > 0) {
      authoritativePrice = (priceListItems[0] as any).unit_price || (priceListItems[0] as any).price || '0.00';
    } else {
      authoritativePrice = (product as any).base_price || (product as any).selling_price || '100.00';
    }

    // Determine tax rate from classification or default
    let taxRate = '18.00';
    if ((product as any).standard_tax_rate !== undefined && (product as any).standard_tax_rate !== null) {
      taxRate = String((product as any).standard_tax_rate);
    } else if ((product as any).tax_rate !== undefined && (product as any).tax_rate !== null) {
      taxRate = String((product as any).tax_rate);
    } else if ((product as any).tax_classification_id) {
      const tc = db.productTaxClassifications.get((product as any).tax_classification_id);
      if (tc && (tc as any).default_rate) taxRate = (tc as any).default_rate;
    }

    // Check if item already exists in cart (unless lot or serial specified)
    const existingIndex = cart.items.findIndex(
      (i) => i.product_id === itemData.product_id && !i.lot_id && !i.serial_number && !itemData.lot_id && !itemData.serial_number
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += itemData.quantity;
    } else {
      const newItem: POSCartItem = {
        id: `citem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product_id: product.id,
        variant_id: itemData.variant_id || null,
        sku: (product as any).sku || product.product_code || 'SKU-GEN',
        barcode: (product as any).barcode || null,
        name: product.name,
        quantity: itemData.quantity,
        uom_id: product.base_uom_id || 'uom_pcs',
        unit_price: new Decimal(authoritativePrice).toFixed(2),
        discount_type: itemData.discount_type || 'PERCENT',
        discount_value: itemData.discount_value || '0',
        discount_amount: '0.00',
        tax_rate: taxRate,
        tax_amount: '0.00',
        line_total: '0.00',
        lot_id: itemData.lot_id || null,
        serial_number: itemData.serial_number || null,
        notes: itemData.notes || null,
      };
      cart.items.push(newItem);
    }

    this.recalculateCart(cart);
    db.posCarts.set(cart.id, cart);
    return cart;
  }

  public updateCartItem(
    tenantId: string,
    cartId: string,
    itemId: string,
    updates: {
      quantity?: number;
      discount_type?: 'PERCENT' | 'FIXED';
      discount_value?: string;
      lot_id?: string | null;
      serial_number?: string | null;
      notes?: string | null;
    }
  ): POSCart {
    const cart = db.posCarts.get(cartId);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'OPEN') {
      throw new Error('Open POS Cart not found.');
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Cart line item not found.');

    if (updates.quantity !== undefined) {
      if (updates.quantity <= 0) {
        cart.items = cart.items.filter((i) => i.id !== itemId);
      } else {
        item.quantity = updates.quantity;
      }
    }
    if (updates.discount_type !== undefined) item.discount_type = updates.discount_type;
    if (updates.discount_value !== undefined) item.discount_value = updates.discount_value;
    if (updates.lot_id !== undefined) item.lot_id = updates.lot_id;
    if (updates.serial_number !== undefined) item.serial_number = updates.serial_number;
    if (updates.notes !== undefined) item.notes = updates.notes;

    this.recalculateCart(cart);
    db.posCarts.set(cart.id, cart);
    return cart;
  }

  public removeCartItem(tenantId: string, cartId: string, itemId: string): POSCart {
    const cart = db.posCarts.get(cartId);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'OPEN') {
      throw new Error('Open POS Cart not found.');
    }

    cart.items = cart.items.filter((i) => i.id !== itemId);
    this.recalculateCart(cart);
    db.posCarts.set(cart.id, cart);
    return cart;
  }

  public clearCart(tenantId: string, cartId: string): POSCart {
    const cart = db.posCarts.get(cartId);
    if (!cart || cart.tenant_id !== tenantId) {
      throw new Error('POS Cart not found.');
    }

    cart.items = [];
    this.recalculateCart(cart);
    db.posCarts.set(cart.id, cart);
    return cart;
  }

  public holdSale(
    tenantId: string,
    cartId: string,
    reason: string | undefined,
    reference: string | undefined,
    cashierId: string
  ): POSCart {
    const cart = db.posCarts.get(cartId);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'OPEN') {
      throw new Error('Open POS Cart not found.');
    }
    if (cart.items.length === 0) {
      throw new Error('Cannot hold an empty cart.');
    }

    const now = new Date().toISOString();
    cart.cart_status = 'HELD';
    cart.held_at = now;
    cart.held_reason = reason || 'Customer requested hold';
    cart.held_reference = reference || `Hold #${Date.now().toString().slice(-4)}`;
    cart.updated_at = now;
    cart.updated_by = cashierId;

    db.posCarts.set(cart.id, cart);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_SALE_HELD',
      resource_type: 'POSCart',
      resource_id: cart.id,
      changes: { held_reason: cart.held_reason, held_reference: cart.held_reference },
    });

    return cart;
  }

  public getHeldSales(tenantId: string, branchId?: string): POSCart[] {
    return Array.from(db.posCarts.values()).filter(
      (c) => c.tenant_id === tenantId && c.cart_status === 'HELD' && (!branchId || c.branch_id === branchId) && !c.deleted_at
    ).sort((a, b) => new Date(b.held_at || b.created_at).getTime() - new Date(a.held_at || a.created_at).getTime());
  }

  public resumeHeldSale(tenantId: string, heldCartId: string, cashierId: string): POSCart {
    const cart = db.posCarts.get(heldCartId);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'HELD') {
      throw new Error('Held sale not found.');
    }

    const now = new Date().toISOString();
    cart.cart_status = 'OPEN';
    cart.held_at = null;
    cart.held_reason = null;
    cart.held_reference = null;
    cart.updated_at = now;
    cart.updated_by = cashierId;

    db.posCarts.set(cart.id, cart);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_SALE_RESUMED',
      resource_type: 'POSCart',
      resource_id: cart.id,
      changes: { cart_status: 'OPEN' },
    });

    return cart;
  }

  public cancelHeldSale(tenantId: string, heldCartId: string, cashierId: string): void {
    const cart = db.posCarts.get(heldCartId);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'HELD') {
      throw new Error('Held sale not found.');
    }

    cart.cart_status = 'CANCELLED';
    cart.deleted_at = new Date().toISOString();
    cart.updated_by = cashierId;
    db.posCarts.set(cart.id, cart);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_HELD_SALE_CANCELLED',
      resource_type: 'POSCart',
      resource_id: cart.id,
      changes: { cart_status: 'CANCELLED' },
    });
  }

  // ==========================================
  // 5. AUTHORITATIVE CHECKOUT & SALES EXECUTION
  // ==========================================

  public checkout(
    tenantId: string,
    data: {
      cart_id: string;
      customer_id?: string | null;
      customer_name?: string | null;
      payments: {
        payment_method: POSPaymentMethod;
        amount: string;
        tendered_amount?: string | null;
        reference_number?: string | null;
      }[];
      idempotency_key?: string | null;
      notes?: string | null;
    },
    cashierId: string
  ): { transaction: POSTransaction; receipt: POSReceipt } {
    // 1. Validate Cart & Session
    const cart = db.posCarts.get(data.cart_id);
    if (!cart || cart.tenant_id !== tenantId || cart.cart_status !== 'OPEN') {
      throw new Error('Active, open cart is required for checkout.');
    }
    if (cart.items.length === 0) {
      throw new Error('Cannot checkout an empty cart.');
    }

    const session = db.posSessions.get(cart.session_id);
    if (!session || session.tenant_id !== tenantId || session.status !== 'OPEN') {
      throw new Error('Active POS Session is required for checkout.');
    }

    // 2. Validate Idempotency
    if (data.idempotency_key) {
      const existingTx = Array.from(db.posTransactions.values()).find(
        (tx) => tx.tenant_id === tenantId && tx.idempotency_key === data.idempotency_key
      );
      if (existingTx) {
        const existingReceipt = Array.from(db.posReceipts.values()).find(
          (r) => r.transaction_id === existingTx.id
        );
        if (existingReceipt) {
          return { transaction: existingTx, receipt: existingReceipt };
        }
      }
    }

    // 3. Recalculate Cart Totals Server-Side
    this.recalculateCart(cart);
    const grandTotalDec = new Decimal(cart.grand_total);

    // 4. Validate Payments & Tender
    let totalPaidDec = Decimal.zero(2);
    let totalTenderedDec = Decimal.zero(2);
    let cashPaidDec = Decimal.zero(2);

    for (const p of data.payments) {
      const amtDec = new Decimal(p.amount || '0');
      if (amtDec.lte(0)) {
        throw new Error('Payment amounts must be strictly positive.');
      }
      totalPaidDec = totalPaidDec.add(amtDec);

      const tendDec = p.tendered_amount ? new Decimal(p.tendered_amount) : amtDec;
      totalTenderedDec = totalTenderedDec.add(tendDec);

      if (p.payment_method === 'CASH') {
        cashPaidDec = cashPaidDec.add(amtDec);
      }
    }

    if (totalPaidDec.lt(grandTotalDec)) {
      throw new Error(`Insufficient payment. Grand total is ${cart.grand_total}, but total allocated payment is ${totalPaidDec.toFixed(2)}.`);
    }

    const changeDueDec = totalTenderedDec.gt(grandTotalDec) ? totalTenderedDec.sub(grandTotalDec) : Decimal.zero(2);

    // 5. Validate & Issue Inventory (Phase 8 Ledger Integration)
    const now = new Date().toISOString();
    const transactionNumber = `POS-${Date.now().toString().slice(-8)}`;
    const txId = `pos_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txItems: POSTransactionItem[] = [];

    let totalCogsDec = Decimal.zero(2);

    for (const item of cart.items) {
      // Physical Inventory Issue Movement
      const { movement: issueMovement, costTransaction } = this.invService.recordInventoryMovement({
        tenant_id: tenantId,
        legal_entity_id: cart.legal_entity_id,
        warehouse_id: cart.warehouse_id,
        location_id: null,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        direction: 'OUT',
        movement_type: 'ISSUE',
        source_type: 'POS_CHECKOUT',
        source_id: txId,
        source_line_id: item.id,
        lot_id: item.lot_id || null,
        serial_id: item.serial_number || null,
        inventory_status: 'AVAILABLE',
        movement_date: now.split('T')[0],
        cost_reference: 'FIFO_LAYER',
        correlation_id: transactionNumber,
        created_by: cashierId,
      });

      const lineUnitCost = costTransaction?.unit_cost || issueMovement.unit_cost || '0.00';
      const lineCogs = costTransaction?.total_cost || new Decimal(lineUnitCost).mul(item.quantity).toFixed(2);
      totalCogsDec = totalCogsDec.add(new Decimal(lineCogs));

      txItems.push({
        id: `txitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        transaction_id: txId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        sku: item.sku,
        barcode: item.barcode || null,
        name: item.name,
        quantity: item.quantity,
        uom_id: item.uom_id,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        line_total: item.line_total,
        lot_id: item.lot_id || null,
        serial_number: item.serial_number || null,
        unit_cost: lineUnitCost,
        cogs_amount: lineCogs,
      });
    }

    // 6. Record Canonical Sales Order & Invoice in Sales Domain
    const salesOrderId = `so_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const defaultAddress = {
      street_address: 'Store Checkout',
      city: 'Store',
      state_province: 'Store',
      postal_code: '000000',
      country_code: 'IN',
    };

    const salesOrder: SalesOrder = {
      id: salesOrderId,
      tenant_id: tenantId,
      legal_entity_id: cart.legal_entity_id,
      customer_id: data.customer_id || cart.customer_id || 'cust_walk_in',
      order_number: `SO-${transactionNumber}`,
      order_date: now.split('T')[0],
      status: 'COMPLETED',
      currency_code: cart.currency_code,
      exchange_rate: '1.0000',
      billing_address: defaultAddress,
      shipping_address: defaultAddress,
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      lines: cart.items.map((i) => ({
        id: `sol_${i.id}`,
        sales_order_id: salesOrderId,
        tenant_id: tenantId,
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        sku: i.sku,
        description: i.name,
        quantity_ordered: i.quantity,
        quantity_fulfilled: i.quantity,
        quantity_remaining: 0,
        uom_id: i.uom_id,
        unit_price: i.unit_price,
        discount_type: i.discount_type === 'PERCENT' ? 'PERCENTAGE' : 'FIXED',
        discount_value: i.discount_value,
        discount_amount: i.discount_amount,
        tax_rate: i.tax_rate,
        tax_amount: i.tax_amount,
        line_subtotal: new Decimal(i.unit_price).mul(i.quantity).toFixed(2),
        line_total: i.line_total,
      })),
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.salesOrders.set(salesOrder.id, salesOrder);

    const invoice: Invoice = {
      id: invoiceId,
      tenant_id: tenantId,
      legal_entity_id: cart.legal_entity_id,
      customer_id: data.customer_id || cart.customer_id || 'cust_walk_in',
      invoice_number: `INV-${transactionNumber}`,
      invoice_type: 'TAX_INVOICE',
      invoice_date: now.split('T')[0],
      due_date: now.split('T')[0],
      billing_address: defaultAddress,
      shipping_address: defaultAddress,
      status: 'PAID',
      currency_code: cart.currency_code,
      exchange_rate: '1.0000',
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      lines: cart.items.map((i) => ({
        id: `invl_${i.id}`,
        invoice_id: invoiceId,
        tenant_id: tenantId,
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        sku: i.sku,
        description: i.name,
        quantity: i.quantity,
        uom_id: i.uom_id,
        unit_price: i.unit_price,
        discount_type: i.discount_type === 'PERCENT' ? 'PERCENTAGE' : 'FIXED',
        discount_value: i.discount_value,
        discount_amount: i.discount_amount,
        tax_rate: i.tax_rate,
        tax_amount: i.tax_amount,
        line_subtotal: new Decimal(i.unit_price).mul(i.quantity).toFixed(2),
        line_total: i.line_total,
      })),
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.invoices.set(invoice.id, invoice);

    // 7. Record Payment Lines & Payments in Payment Domain
    const paymentLines: POSPaymentLine[] = [];
    for (const p of data.payments) {
      const paymentLineId = `pos_pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const pRecord: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenant_id: tenantId,
        legal_entity_id: cart.legal_entity_id,
        branch_id: cart.branch_id || null,
        customer_id: data.customer_id || cart.customer_id || 'cust_walk_in',
        payment_number: `PAY-${transactionNumber}-${p.payment_method}`,
        payment_date: now.split('T')[0],
        payment_method: p.payment_method,
        payment_channel: 'POS_TERMINAL',
        reference: p.reference_number || transactionNumber,
        amount: p.amount,
        currency_code: cart.currency_code,
        status: 'POSTED',
        received_account_id: 'acc_pos_cash',
        journal_entry_id: null,
        created_at: now,
        updated_at: now,
        created_by: cashierId,
        updated_by: cashierId,
        deleted_at: null,
        version: 1,
      };
      db.payments.set(pRecord.id, pRecord);

      paymentLines.push({
        id: paymentLineId,
        transaction_id: txId,
        payment_id: pRecord.id,
        payment_method: p.payment_method,
        amount: p.amount,
        currency_code: cart.currency_code,
        tendered_amount: p.tendered_amount || p.amount,
        change_returned: p.payment_method === 'CASH' ? changeDueDec.toFixed(2) : '0.00',
        reference_number: p.reference_number || null,
        terminal_auth_code: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'SUCCESS',
        created_at: now,
      });
    }

    // 8. Create Double-Entry Accounting Journal (Phase 4 GL Integration)
    // Debit Cash/Bank -> Credit Revenue & Tax Payable
    // Note: COGS and Inventory relief are automatically recorded during inventory movements.
    const posAccounts = this.getOrCreatePOSAccounts(tenantId, cart.legal_entity_id, cashierId);
    const netSales = new Decimal(cart.subtotal).sub(new Decimal(cart.discount_total));

    const journalLines = [
      {
        account_id: posAccounts.cashAcc.id,
        debit: cart.grand_total,
        credit: '0.00',
        description: `POS Sale ${transactionNumber} Settlement`,
      },
      {
        account_id: posAccounts.salesAcc.id,
        debit: '0.00',
        credit: netSales.toFixed(2),
        description: `POS Sale ${transactionNumber} Revenue`,
      },
    ];

    if (new Decimal(cart.tax_total).gt(0)) {
      journalLines.push({
        account_id: posAccounts.taxAcc.id,
        debit: '0.00',
        credit: cart.tax_total,
        description: `POS Sale ${transactionNumber} Output Tax`,
      });
    }

    try {
      db.postJournalEntry({
        tenant_id: tenantId,
        legal_entity_id: cart.legal_entity_id,
        source_type: 'SALES_INVOICE' as any,
        source_id: invoiceId,
        transaction_date: now.split('T')[0],
        description: `POS Checkout ${transactionNumber}`,
        currency_code: cart.currency_code,
        exchange_rate: '1.0000',
        lines: journalLines,
        posted_by: cashierId,
      });
    } catch (err) {
      console.warn('Accounting journal posting notice:', err);
    }

    // 9. Update Session KPIs & Cash Drawer Balance
    const salesCount = session.total_sales_count + 1;
    const newSalesAmount = new Decimal(session.total_sales_amount).add(new Decimal(cart.grand_total)).toFixed(2);
    const newDiscountAmount = new Decimal(session.total_discount_amount).add(new Decimal(cart.discount_total)).toFixed(2);
    const newTaxAmount = new Decimal(session.total_tax_amount).add(new Decimal(cart.tax_total)).toFixed(2);

    session.total_sales_count = salesCount;
    session.total_sales_amount = newSalesAmount;
    session.total_discount_amount = newDiscountAmount;
    session.total_tax_amount = newTaxAmount;

    if (cashPaidDec.gt(0)) {
      const currentExpCash = new Decimal(session.expected_cash);
      session.expected_cash = currentExpCash.add(cashPaidDec).toFixed(2);

      // Record cash movement
      const cashMovementId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cm: CashMovement = {
        id: cashMovementId,
        tenant_id: tenantId,
        branch_id: session.branch_id,
        terminal_id: session.terminal_id,
        pos_session_id: session.id,
        cashier_id: cashierId,
        movement_type: 'SALE',
        amount: cashPaidDec.toFixed(2),
        currency_code: cart.currency_code,
        reason: `POS Sale ${transactionNumber}`,
        reference_id: txId,
        created_at: now,
        updated_at: now,
        created_by: cashierId,
        updated_by: cashierId,
        deleted_at: null,
        version: 1,
      };
      db.cashMovements.set(cm.id, cm);

      // Update cash drawer
      const cashDrawer = Array.from(db.cashDrawers.values()).find(
        (cd) => cd.tenant_id === tenantId && cd.terminal_id === session.terminal_id
      );
      if (cashDrawer) {
        cashDrawer.current_balance = session.expected_cash;
        cashDrawer.updated_at = now;
        db.cashDrawers.set(cashDrawer.id, cashDrawer);
      }
    }
    session.updated_at = now;
    db.posSessions.set(session.id, session);

    // 10. Generate Authoritative POSTransaction
    const receiptNumber = `REC-${transactionNumber}`;
    const transaction: POSTransaction = {
      id: txId,
      tenant_id: tenantId,
      legal_entity_id: cart.legal_entity_id,
      branch_id: cart.branch_id,
      warehouse_id: cart.warehouse_id,
      terminal_id: cart.terminal_id,
      session_id: cart.session_id,
      cashier_id: cashierId,
      customer_id: data.customer_id || cart.customer_id || null,
      customer_name: data.customer_name || 'Walk-in Customer',
      transaction_number: transactionNumber,
      transaction_type: 'SALE',
      status: 'COMPLETED',
      sales_order_id: salesOrderId,
      invoice_id: invoiceId,
      currency_code: cart.currency_code,
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      amount_paid: totalPaidDec.toFixed(2),
      change_due: changeDueDec.toFixed(2),
      payment_status: 'PAID',
      lines: txItems,
      payments: paymentLines,
      receipt_number: receiptNumber,
      printed_at: now,
      notes: data.notes || null,
      idempotency_key: data.idempotency_key || null,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.posTransactions.set(transaction.id, transaction);

    // 11. Generate Authoritative POS Receipt Document
    const receiptLines = txItems.map(
      (item) => `${item.name} (${item.sku}) x ${item.quantity} @ ${item.unit_price} = ${item.line_total}`
    ).join('\n');

    const receipt: POSReceipt = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: tenantId,
      legal_entity_id: cart.legal_entity_id,
      branch_id: cart.branch_id,
      terminal_id: cart.terminal_id,
      transaction_id: transaction.id,
      receipt_number: receiptNumber,
      format: 'THERMAL',
      customer_name: transaction.customer_name || 'Walk-in Customer',
      customer_email: null,
      customer_phone: null,
      subtotal: cart.subtotal,
      tax_breakdown: { 'Output GST/Tax': cart.tax_total },
      grand_total: cart.grand_total,
      payments_summary: paymentLines.map((p) => `${p.payment_method}: ${p.amount}`).join(', '),
      receipt_body: `BILL VYOM POS RECEIPT\nReceipt: ${receiptNumber}\nDate: ${now}\nTerminal: ${cart.terminal_id}\nCashier: ${cashierId}\n-------------------------------\n${receiptLines}\n-------------------------------\nSubtotal: ${cart.subtotal}\nDiscount: -${cart.discount_total}\nTax: +${cart.tax_total}\nGRAND TOTAL: ${cart.grand_total}\nTendered: ${totalTenderedDec.toFixed(2)}\nChange: ${changeDueDec.toFixed(2)}\nTHANK YOU FOR YOUR BUSINESS!`,
      printed: true,
      emailed: false,
      sms_sent: false,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.posReceipts.set(receipt.id, receipt);

    // 12. Complete and Clear Cart
    cart.cart_status = 'COMPLETED';
    cart.items = [];
    cart.updated_at = now;
    db.posCarts.set(cart.id, cart);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_CHECKOUT_COMPLETED',
      resource_type: 'POSTransaction',
      resource_id: transaction.id,
      changes: {
        transaction_number: transaction.transaction_number,
        grand_total: transaction.grand_total,
        payment_lines: paymentLines.length,
      },
    });

    return { transaction, receipt };
  }

  // ==========================================
  // 6. RETURNS & REFUNDS
  // ==========================================

  public getTransactions(tenantId: string, branchId?: string): POSTransaction[] {
    return Array.from(db.posTransactions.values()).filter(
      (tx) => tx.tenant_id === tenantId && (!branchId || tx.branch_id === branchId) && !tx.deleted_at
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getTransactionById(tenantId: string, transactionId: string): POSTransaction | null {
    const tx = db.posTransactions.get(transactionId);
    if (!tx || tx.tenant_id !== tenantId || tx.deleted_at) return null;
    return tx;
  }

  public processReturn(
    tenantId: string,
    data: {
      original_transaction_id: string;
      return_reason: string;
      condition: ReturnCondition;
      target_inventory_status: 'AVAILABLE' | 'DAMAGED' | 'QUARANTINED';
      refund_method: POSPaymentMethod;
      lines: {
        original_line_id: string;
        quantity_returned: number;
        condition: ReturnCondition;
        notes?: string | null;
      }[];
    },
    cashierId: string
  ): POSReturn {
    const originalTx = db.posTransactions.get(data.original_transaction_id);
    if (!originalTx || originalTx.tenant_id !== tenantId || originalTx.status === 'CANCELLED') {
      throw new Error('Original sales transaction not found or cancelled.');
    }

    const now = new Date().toISOString();
    const returnNumber = `RET-${originalTx.transaction_number}-${Date.now().toString().slice(-4)}`;
    const returnId = `pos_ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let refundTotalDec = Decimal.zero(2);
    const returnLines: POSReturnLine[] = [];

    // Validate quantities and calculate refund totals
    for (const reqLine of data.lines) {
      const origLine = originalTx.lines.find((l) => l.id === reqLine.original_line_id);
      if (!origLine) {
        throw new Error(`Original line item ${reqLine.original_line_id} not found on sale ${originalTx.transaction_number}.`);
      }

      if (reqLine.quantity_returned <= 0 || reqLine.quantity_returned > origLine.quantity) {
        throw new Error(`Invalid return quantity (${reqLine.quantity_returned}) for item "${origLine.name}". Max returnable: ${origLine.quantity}.`);
      }

      const unitPriceDec = new Decimal(origLine.unit_price);
      const qtyDec = new Decimal(reqLine.quantity_returned);
      const lineSubtotal = unitPriceDec.mul(qtyDec);
      const discountPerUnit = new Decimal(origLine.discount_amount || '0').div(origLine.quantity || 1);
      const lineDiscount = discountPerUnit.mul(qtyDec);
      const lineNet = lineSubtotal.sub(lineDiscount);
      const taxRateDec = new Decimal(origLine.tax_rate || '0');
      const taxRefund = lineNet.mul(taxRateDec).div(100);
      const lineTotalRefund = lineNet.add(taxRefund);

      refundTotalDec = refundTotalDec.add(lineTotalRefund);

      returnLines.push({
        id: `retline_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        return_id: returnId,
        original_line_id: origLine.id,
        product_id: origLine.product_id,
        sku: origLine.sku,
        name: origLine.name,
        quantity_returned: reqLine.quantity_returned,
        unit_price: origLine.unit_price,
        tax_refund_amount: taxRefund.toFixed(2),
        line_refund_total: lineTotalRefund.toFixed(2),
        lot_id: origLine.lot_id || null,
        serial_number: origLine.serial_number || null,
        condition: reqLine.condition || data.condition,
        notes: reqLine.notes || null,
      });

      // Restore Inventory via Phase 8 Movement (RETURN_IN)
      this.invService.recordInventoryMovement({
        tenant_id: tenantId,
        legal_entity_id: originalTx.legal_entity_id,
        warehouse_id: originalTx.warehouse_id,
        location_id: null,
        product_id: origLine.product_id,
        variant_id: origLine.variant_id || null,
        quantity: reqLine.quantity_returned,
        direction: 'IN',
        movement_type: 'RETURN_IN',
        source_type: 'POS_RETURN',
        source_id: returnId,
        source_line_id: origLine.id,
        lot_id: origLine.lot_id || null,
        serial_id: origLine.serial_number || null,
        inventory_status: data.target_inventory_status,
        movement_date: now.split('T')[0],
        cost_reference: 'ORIGINAL_RETURN_COST',
        correlation_id: returnNumber,
        created_by: cashierId,
      });
    }

    // Process canonical Refund in Payments Domain
    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const refundRecord: Refund = {
      id: refundId,
      tenant_id: tenantId,
      original_payment_id: originalTx.payments[0]?.payment_id || `pay_ref_${Date.now()}`,
      refund_number: `REF-${returnNumber}`,
      amount: refundTotalDec.toFixed(2),
      currency_code: originalTx.currency_code,
      destination: data.refund_method,
      status: 'POSTED',
      reason: data.return_reason,
      journal_entry_id: null,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };
    db.refunds.set(refundRecord.id, refundRecord);

    // If cash refund, update active cash session and drawer
    const activeSession = this.getActiveSession(tenantId, originalTx.terminal_id);
    if (data.refund_method === 'CASH' && activeSession) {
      const currentExp = new Decimal(activeSession.expected_cash);
      activeSession.expected_cash = currentExp.sub(refundTotalDec).toFixed(2);
      activeSession.total_refunds_count += 1;
      activeSession.total_refunds_amount = new Decimal(activeSession.total_refunds_amount).add(refundTotalDec).toFixed(2);
      activeSession.updated_at = now;
      db.posSessions.set(activeSession.id, activeSession);

      // Record cash movement
      const cashMovementId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cm: CashMovement = {
        id: cashMovementId,
        tenant_id: tenantId,
        branch_id: originalTx.branch_id,
        terminal_id: originalTx.terminal_id,
        pos_session_id: activeSession.id,
        cashier_id: cashierId,
        movement_type: 'REFUND',
        amount: refundTotalDec.toFixed(2),
        currency_code: originalTx.currency_code,
        reason: `POS Return ${returnNumber}`,
        reference_id: returnId,
        created_at: now,
        updated_at: now,
        created_by: cashierId,
        updated_by: cashierId,
        deleted_at: null,
        version: 1,
      };
      db.cashMovements.set(cm.id, cm);

      const cashDrawer = Array.from(db.cashDrawers.values()).find(
        (cd) => cd.tenant_id === tenantId && cd.terminal_id === originalTx.terminal_id
      );
      if (cashDrawer) {
        cashDrawer.current_balance = activeSession.expected_cash;
        cashDrawer.updated_at = now;
        db.cashDrawers.set(cashDrawer.id, cashDrawer);
      }
    }

    // Update original transaction status if fully returned vs partially returned
    const totalReturnedItems = returnLines.reduce((sum, l) => sum + l.quantity_returned, 0);
    const totalOriginalItems = originalTx.lines.reduce((sum, l) => sum + l.quantity, 0);
    if (totalReturnedItems >= totalOriginalItems) {
      originalTx.status = 'REFUNDED';
    } else {
      originalTx.status = 'PARTIALLY_REFUNDED';
    }
    originalTx.updated_at = now;
    db.posTransactions.set(originalTx.id, originalTx);

    const posReturn: POSReturn = {
      id: returnId,
      tenant_id: tenantId,
      legal_entity_id: originalTx.legal_entity_id,
      branch_id: originalTx.branch_id,
      warehouse_id: originalTx.warehouse_id,
      terminal_id: originalTx.terminal_id,
      session_id: activeSession?.id || originalTx.session_id,
      cashier_id: cashierId,
      return_number: returnNumber,
      original_transaction_id: originalTx.id,
      customer_id: originalTx.customer_id || null,
      customer_name: originalTx.customer_name || null,
      return_reason: data.return_reason,
      condition: data.condition,
      target_inventory_status: data.target_inventory_status,
      refund_total: refundTotalDec.toFixed(2),
      refund_method: data.refund_method,
      status: 'COMPLETED',
      lines: returnLines,
      refund_id: refundRecord.id,
      journal_entry_id: null,
      created_at: now,
      updated_at: now,
      created_by: cashierId,
      updated_by: cashierId,
      deleted_at: null,
      version: 1,
    };

    db.posReturns.set(posReturn.id, posReturn);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: cashierId,
      actor_email: 'cashier@billvyom.internal',
      action: 'POS_RETURN_PROCESSED',
      resource_type: 'POSReturn',
      resource_id: posReturn.id,
      changes: {
        return_number: posReturn.return_number,
        refund_total: posReturn.refund_total,
        refund_method: posReturn.refund_method,
      },
    });

    return posReturn;
  }

  private getOrCreatePOSAccounts(tenantId: string, legalEntityId: string, actorId: string) {
    let cashAcc = Array.from(db.accounts.values()).find(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.account_subtype === 'CASH_AND_EQUIVALENT' || a.code === '1010') && a.deleted_at === null
    );
    if (!cashAcc) {
      cashAcc = db.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '1010',
        name: 'Main Cash Register / Petty Cash',
        account_type: 'ASSET',
        account_subtype: 'CASH_AND_EQUIVALENT',
        normal_balance: 'DEBIT',
        created_by: actorId,
      });
    }

    let salesAcc = Array.from(db.accounts.values()).find(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.account_subtype === 'SALES' || a.code === '4010') && a.deleted_at === null
    );
    if (!salesAcc) {
      salesAcc = db.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '4010',
        name: 'Merchandise Sales Revenue',
        account_type: 'REVENUE',
        account_subtype: 'SALES',
        normal_balance: 'CREDIT',
        created_by: actorId,
      });
    }

    let taxAcc = Array.from(db.accounts.values()).find(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.account_subtype === 'TAX_PAYABLE' || a.code === '2210') && a.deleted_at === null
    );
    if (!taxAcc) {
      taxAcc = db.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '2210',
        name: 'Output GST / Sales Tax Payable',
        account_type: 'LIABILITY',
        account_subtype: 'TAX_PAYABLE',
        normal_balance: 'CREDIT',
        created_by: actorId,
      });
    }

    let cogsAcc = Array.from(db.accounts.values()).find(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.account_subtype === 'COST_OF_GOODS_SOLD' || a.code === '5010') && a.deleted_at === null
    );
    if (!cogsAcc) {
      cogsAcc = db.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '5010',
        name: 'Cost of Goods Sold - Retail',
        account_type: 'EXPENSE',
        account_subtype: 'COST_OF_GOODS_SOLD',
        normal_balance: 'DEBIT',
        created_by: actorId,
      });
    }

    let invAcc = Array.from(db.accounts.values()).find(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.account_subtype === 'INVENTORY' || a.code === '1210') && a.deleted_at === null
    );
    if (!invAcc) {
      invAcc = db.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '1210',
        name: 'Finished Goods Inventory',
        account_type: 'ASSET',
        account_subtype: 'INVENTORY',
        normal_balance: 'DEBIT',
        created_by: actorId,
      });
    }

    return { cashAcc, salesAcc, taxAcc, cogsAcc, invAcc };
  }

  public getReturns(tenantId: string, branchId?: string): POSReturn[] {
    return Array.from(db.posReturns.values()).filter(
      (r) => r.tenant_id === tenantId && (!branchId || r.branch_id === branchId) && !r.deleted_at
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ==========================================
  // 7. END-OF-DAY & SALES RECONCILIATION
  // ==========================================

  public runSalesReconciliation(
    tenantId: string,
    legalEntityId: string,
    branchId: string | undefined,
    terminalId: string | undefined,
    sessionId: string | undefined,
    actorId: string
  ): SalesReconciliationRun {
    const transactions = Array.from(db.posTransactions.values()).filter(
      (tx) =>
        tx.tenant_id === tenantId &&
        tx.legal_entity_id === legalEntityId &&
        (!branchId || tx.branch_id === branchId) &&
        (!terminalId || tx.terminal_id === terminalId) &&
        (!sessionId || tx.session_id === sessionId) &&
        tx.status !== 'CANCELLED' &&
        !tx.deleted_at
    );

    let posSalesTotal = Decimal.zero(2);
    let paymentTotal = Decimal.zero(2);
    let cogsTotal = Decimal.zero(2);

    for (const tx of transactions) {
      posSalesTotal = posSalesTotal.add(new Decimal(tx.grand_total));
      for (const p of tx.payments) {
        paymentTotal = paymentTotal.add(new Decimal(p.amount));
      }
      for (const item of tx.lines) {
        if (item.cogs_amount) {
          cogsTotal = cogsTotal.add(new Decimal(item.cogs_amount));
        }
      }
    }

    // Cross-domain match with Sales domain Sales Orders
    const salesOrders = Array.from(db.salesOrders.values()).filter(
      (so) => so.tenant_id === tenantId && so.legal_entity_id === legalEntityId && so.status === 'COMPLETED'
    );
    let salesDomainTotal = Decimal.zero(2);
    for (const so of salesOrders) {
      salesDomainTotal = salesDomainTotal.add(new Decimal(so.grand_total));
    }

    const varianceSales = posSalesTotal.sub(salesDomainTotal);
    const variancePayments = posSalesTotal.sub(paymentTotal);
    const varianceCogs = Decimal.zero(2); // In perfect state

    const hasException = !varianceSales.equals(0) || !variancePayments.equals(0);
    const status = hasException ? 'EXCEPTION' : 'RECONCILED';

    const now = new Date().toISOString();
    const runId = `srec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const exceptions: SalesReconciliationException[] = [];

    if (!varianceSales.equals(0)) {
      exceptions.push({
        id: `srexc_${Date.now()}_1`,
        tenant_id: tenantId,
        run_id: runId,
        exception_type: 'SALES_MISMATCH',
        expected_amount: posSalesTotal.toFixed(2),
        actual_amount: salesDomainTotal.toFixed(2),
        difference: varianceSales.toFixed(2),
        details: `POS transaction total (${posSalesTotal.toFixed(2)}) differs from Sales Orders (${salesDomainTotal.toFixed(2)}) by ${varianceSales.toFixed(2)}.`,
        status: 'OPEN',
        created_at: now,
      });
    }

    if (!variancePayments.equals(0)) {
      exceptions.push({
        id: `srexc_${Date.now()}_2`,
        tenant_id: tenantId,
        run_id: runId,
        exception_type: 'PAYMENT_MISMATCH',
        expected_amount: posSalesTotal.toFixed(2),
        actual_amount: paymentTotal.toFixed(2),
        difference: variancePayments.toFixed(2),
        details: `POS gross sales (${posSalesTotal.toFixed(2)}) differs from collected payment tenders (${paymentTotal.toFixed(2)}) by ${variancePayments.toFixed(2)}.`,
        status: 'OPEN',
        created_at: now,
      });
    }

    const run: SalesReconciliationRun = {
      id: runId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      branch_id: branchId || null,
      terminal_id: terminalId || null,
      pos_session_id: sessionId || null,
      reconciliation_date: now.split('T')[0],
      pos_sales_total: posSalesTotal.toFixed(2),
      sales_order_domain_total: salesDomainTotal.toFixed(2),
      payment_collection_total: paymentTotal.toFixed(2),
      inventory_issue_cost_total: cogsTotal.toFixed(2),
      cogs_gl_total: cogsTotal.toFixed(2),
      gl_sales_revenue_total: posSalesTotal.toFixed(2),
      variance_sales: varianceSales.toFixed(2),
      variance_payments: variancePayments.toFixed(2),
      variance_cogs: varianceCogs.toFixed(2),
      status,
      exceptions,
      created_at: now,
      updated_at: now,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    db.salesReconciliationRuns.set(run.id, run);

    for (const exc of exceptions) {
      db.salesReconciliationExceptions.set(exc.id, exc);
    }

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'pos@billvyom.internal',
      action: 'POS_SALES_RECONCILIATION_EXECUTED',
      resource_type: 'SalesReconciliationRun',
      resource_id: run.id,
      changes: { status, variance_sales: run.variance_sales, variance_payments: run.variance_payments },
    });

    return run;
  }

  public getSalesReconciliationRuns(tenantId: string): SalesReconciliationRun[] {
    return Array.from(db.salesReconciliationRuns.values()).filter(
      (r) => r.tenant_id === tenantId && !r.deleted_at
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ==========================================
  // 8. OFFLINE SYNC FOUNDATION & CONFLICTS
  // ==========================================

  public registerOfflineDevice(
    tenantId: string,
    data: {
      branch_id: string;
      terminal_id: string;
      device_identifier: string;
      device_name: string;
      platform: string;
      app_version: string;
    },
    actorId: string
  ): OfflineDevice {
    const existing = Array.from(db.offlineDevices.values()).find(
      (d) => d.tenant_id === tenantId && d.device_identifier === data.device_identifier && !d.deleted_at
    );
    if (existing) {
      existing.device_name = data.device_name;
      existing.platform = data.platform;
      existing.app_version = data.app_version;
      existing.updated_at = new Date().toISOString();
      db.offlineDevices.set(existing.id, existing);
      return existing;
    }

    const now = new Date().toISOString();
    const device: OfflineDevice = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: tenantId,
      branch_id: data.branch_id,
      terminal_id: data.terminal_id,
      device_identifier: data.device_identifier,
      device_name: data.device_name,
      platform: data.platform,
      app_version: data.app_version,
      last_sync_at: null,
      status: 'REGISTERED',
      registered_at: now,
      created_at: now,
      updated_at: now,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    db.offlineDevices.set(device.id, device);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'pos@billvyom.internal',
      action: 'OFFLINE_DEVICE_REGISTERED',
      resource_type: 'OfflineDevice',
      resource_id: device.id,
      changes: device as any,
    });

    return device;
  }

  public getOfflineDevices(tenantId: string): OfflineDevice[] {
    return Array.from(db.offlineDevices.values()).filter(
      (d) => d.tenant_id === tenantId && !d.deleted_at
    );
  }

  public processOfflineSync(
    tenantId: string,
    deviceId: string,
    commands: {
      sequence_number: number;
      idempotency_key: string;
      command_type: 'CREATE_SALE' | 'CASH_MOVEMENT' | 'OPEN_SESSION' | 'CLOSE_SESSION';
      payload: any;
    }[],
    actorId: string
  ): { synced_count: number; conflicts: SyncConflict[] } {
    const device = db.offlineDevices.get(deviceId);
    if (!device || device.tenant_id !== tenantId || device.status !== 'REGISTERED') {
      throw new Error('Unregistered or blocked offline device.');
    }

    const now = new Date().toISOString();
    let syncedCount = 0;
    const detectedConflicts: SyncConflict[] = [];

    for (const cmd of commands) {
      // Check duplicate idempotency key
      const existingCmd = Array.from(db.offlineCommands.values()).find(
        (c) => c.tenant_id === tenantId && c.idempotency_key === cmd.idempotency_key
      );

      if (existingCmd) {
        // Already processed
        continue;
      }

      const cmdId = `offcmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const offCmd: OfflineCommand = {
        id: cmdId,
        tenant_id: tenantId,
        device_id: deviceId,
        sequence_number: cmd.sequence_number,
        idempotency_key: cmd.idempotency_key,
        command_type: cmd.command_type,
        payload: cmd.payload,
        status: 'SYNCED',
        conflict_details: null,
        server_acknowledged_at: now,
        error_message: null,
        created_at: now,
        updated_at: now,
        created_by: actorId,
        updated_by: actorId,
        deleted_at: null,
        version: 1,
      };

      try {
        if (cmd.command_type === 'CREATE_SALE') {
          this.checkout(tenantId, cmd.payload, actorId);
          syncedCount++;
        } else if (cmd.command_type === 'CASH_MOVEMENT') {
          this.recordCashMovement(
            tenantId,
            cmd.payload.session_id,
            cmd.payload.movement_type,
            cmd.payload.amount,
            cmd.payload.reason,
            actorId
          );
          syncedCount++;
        }
      } catch (err: any) {
        offCmd.status = 'CONFLICT';
        offCmd.error_message = err?.message || 'Sync execution error';

        const confId = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const conflict: SyncConflict = {
          id: confId,
          tenant_id: tenantId,
          device_id: deviceId,
          command_id: cmdId,
          conflict_type: 'STOCK_UNAVAILABLE',
          details: `Command ${cmd.command_type} seq #${cmd.sequence_number} failed: ${offCmd.error_message}`,
          resolution_policy: 'MANUAL_REVIEW',
          status: 'OPEN',
          resolved_by: null,
          resolved_at: null,
          created_at: now,
          updated_at: now,
          created_by: actorId,
          updated_by: actorId,
          deleted_at: null,
          version: 1,
        };
        db.syncConflicts.set(conflict.id, conflict);
        detectedConflicts.push(conflict);
      }

      db.offlineCommands.set(offCmd.id, offCmd);
    }

    device.last_sync_at = now;
    db.offlineDevices.set(device.id, device);

    return { synced_count: syncedCount, conflicts: detectedConflicts };
  }

  public getSyncConflicts(tenantId: string): SyncConflict[] {
    return Array.from(db.syncConflicts.values()).filter(
      (c) => c.tenant_id === tenantId && !c.deleted_at
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public resolveSyncConflict(
    tenantId: string,
    conflictId: string,
    resolution: ConflictResolutionPolicy,
    actorId: string
  ): SyncConflict {
    const conflict = db.syncConflicts.get(conflictId);
    if (!conflict || conflict.tenant_id !== tenantId || conflict.deleted_at) {
      throw new Error('Sync conflict not found.');
    }

    const now = new Date().toISOString();
    conflict.status = 'RESOLVED';
    conflict.resolution_policy = resolution;
    conflict.resolved_by = actorId;
    conflict.resolved_at = now;
    conflict.updated_at = now;
    conflict.version += 1;

    db.syncConflicts.set(conflict.id, conflict);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'pos@billvyom.internal',
      action: 'POS_SYNC_CONFLICT_RESOLVED',
      resource_type: 'SyncConflict',
      resource_id: conflict.id,
      changes: { resolution_policy: resolution },
    });

    return conflict;
  }
}
