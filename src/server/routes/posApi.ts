/**
 * Bill Vyom — Phase 9 Global POS & Omnichannel Sales API Gateway
 */

import { Router, Response } from 'express';
import { POSService } from '../services/posService';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';
import { db } from '../db';
import { Decimal } from '../../domain/decimal';

export const posRouter = Router();
const posService = POSService.getInstance();

// ==========================================
// 1. POS DASHBOARD / OVERVIEW
// ==========================================

posRouter.get('/dashboard', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const branchId = req.query.branch_id as string | undefined;

  const terminals = posService.getTerminals(tenant.id, branchId);
  const activeSessions = Array.from(db.posSessions.values()).filter(
    (s) => s.tenant_id === tenant.id && (!branchId || s.branch_id === branchId) && s.status === 'OPEN' && !s.deleted_at
  );
  const transactions = posService.getTransactions(tenant.id, branchId);
  const returns = posService.getReturns(tenant.id, branchId);
  const heldSales = posService.getHeldSales(tenant.id, branchId);
  const conflicts = posService.getSyncConflicts(tenant.id);

  let totalSalesToday = Decimal.zero(2);
  let totalDiscountsToday = Decimal.zero(2);
  let totalTaxToday = Decimal.zero(2);
  let totalReturnsToday = Decimal.zero(2);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.created_at.startsWith(todayStr) && t.status === 'COMPLETED');

  for (const t of todayTransactions) {
    totalSalesToday = totalSalesToday.add(new Decimal(t.grand_total));
    totalDiscountsToday = totalDiscountsToday.add(new Decimal(t.discount_total));
    totalTaxToday = totalTaxToday.add(new Decimal(t.tax_total));
  }

  for (const r of returns.filter((r) => r.created_at.startsWith(todayStr))) {
    totalReturnsToday = totalReturnsToday.add(new Decimal(r.refund_total));
  }

  res.json({
    success: true,
    data: {
      active_terminals_count: terminals.filter((t) => t.status === 'ACTIVE').length,
      open_sessions_count: activeSessions.length,
      today_sales_count: todayTransactions.length,
      today_sales_amount: totalSalesToday.toFixed(2),
      today_discount_amount: totalDiscountsToday.toFixed(2),
      today_tax_amount: totalTaxToday.toFixed(2),
      today_returns_amount: totalReturnsToday.toFixed(2),
      held_sales_count: heldSales.length,
      unresolved_conflicts_count: conflicts.filter((c) => c.status === 'OPEN').length,
    },
  });
});

// ==========================================
// 2. TERMINALS
// ==========================================

posRouter.get('/terminals', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const branchId = req.query.branch_id as string | undefined;
  const terminals = posService.getTerminals(tenant.id, branchId);
  res.json({ success: true, data: terminals });
});

posRouter.post('/terminals', requirePermission('manage', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const terminal = posService.createTerminal(tenant.id, req.body, user.id);
    res.status(201).json({ success: true, data: terminal });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.put('/terminals/:id', requirePermission('manage', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const terminal = posService.updateTerminal(tenant.id, req.params.id, req.body, user.id);
    res.json({ success: true, data: terminal });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. SESSIONS & SHIFTS
// ==========================================

posRouter.get('/sessions', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const branchId = req.query.branch_id as string | undefined;
  const terminalId = req.query.terminal_id as string | undefined;
  const sessions = posService.getSessions(tenant.id, branchId, terminalId);
  res.json({ success: true, data: sessions });
});

posRouter.get('/sessions/active', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const terminalId = req.query.terminal_id as string;
  if (!terminalId) {
    return res.status(400).json({ success: false, error: 'terminal_id is required' });
  }
  const session = posService.getActiveSession(tenant.id, terminalId);
  res.json({ success: true, data: session });
});

posRouter.post('/sessions/open', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const session = posService.openSession(tenant.id, req.body, user.id);
    res.status(201).json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.post('/sessions/:id/close', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const { counted_cash, closing_notes } = req.body;
    const session = posService.closeSession(tenant.id, req.params.id, counted_cash, closing_notes, user.id);
    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. CASH MOVEMENTS
// ==========================================

posRouter.get('/sessions/:id/cash-movements', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const movements = posService.getCashMovements(tenant.id, req.params.id);
  res.json({ success: true, data: movements });
});

posRouter.post('/sessions/:id/cash-movements', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const { movement_type, amount, reason } = req.body;
    const movement = posService.recordCashMovement(tenant.id, req.params.id, movement_type, amount, reason, user.id);
    res.status(201).json({ success: true, data: movement });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. CART & HELD SALES
// ==========================================

posRouter.get('/cart', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'session_id is required' });
  }
  try {
    const cart = posService.getOrCreateCart(tenant.id, sessionId, user.id);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.post('/cart/items', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  try {
    const { cart_id, product_id, variant_id, quantity, lot_id, serial_number, discount_type, discount_value, notes } = req.body;
    const cart = posService.addItemToCart(tenant.id, cart_id, {
      product_id,
      variant_id,
      quantity: Number(quantity) || 1,
      lot_id,
      serial_number,
      discount_type,
      discount_value,
      notes,
    });
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.put('/cart/items/:itemId', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  try {
    const { cart_id, quantity, discount_type, discount_value, lot_id, serial_number, notes } = req.body;
    const cart = posService.updateCartItem(tenant.id, cart_id, req.params.itemId, {
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      discount_type,
      discount_value,
      lot_id,
      serial_number,
      notes,
    });
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.delete('/cart/items/:itemId', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  try {
    const cartId = req.query.cart_id as string;
    if (!cartId) return res.status(400).json({ success: false, error: 'cart_id query parameter is required' });
    const cart = posService.removeCartItem(tenant.id, cartId, req.params.itemId);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.post('/cart/clear', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  try {
    const { cart_id } = req.body;
    const cart = posService.clearCart(tenant.id, cart_id);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.post('/cart/hold', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const { cart_id, reason, reference } = req.body;
    const cart = posService.holdSale(tenant.id, cart_id, reason, reference, user.id);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.get('/held-sales', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const branchId = req.query.branch_id as string | undefined;
  const heldSales = posService.getHeldSales(tenant.id, branchId);
  res.json({ success: true, data: heldSales });
});

posRouter.post('/held-sales/:id/resume', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const cart = posService.resumeHeldSale(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.delete('/held-sales/:id', requirePermission('delete', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    posService.cancelHeldSale(tenant.id, req.params.id, user.id);
    res.json({ success: true, message: 'Held sale cancelled.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. CHECKOUT & TRANSACTIONS
// ==========================================

posRouter.post('/checkout', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const result = posService.checkout(tenant.id, req.body, user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.get('/transactions', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const branchId = req.query.branch_id as string | undefined;
  const transactions = posService.getTransactions(tenant.id, branchId);
  res.json({ success: true, data: transactions });
});

posRouter.get('/transactions/:id', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const tx = posService.getTransactionById(tenant.id, req.params.id);
  if (!tx) return res.status(404).json({ success: false, error: 'Transaction not found.' });

  const receipt = Array.from(db.posReceipts.values()).find((r) => r.transaction_id === tx.id);
  res.json({ success: true, data: { ...tx, receipt } });
});

// ==========================================
// 7. RETURNS & REFUNDS
// ==========================================

posRouter.post('/returns', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const posReturn = posService.processReturn(tenant.id, req.body, user.id);
    res.status(201).json({ success: true, data: posReturn });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.get('/returns', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const branchId = req.query.branch_id as string | undefined;
  const returns = posService.getReturns(tenant.id, branchId);
  res.json({ success: true, data: returns });
});

// ==========================================
// 8. SALES RECONCILIATION & AUDIT
// ==========================================

posRouter.get('/reconciliation', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const runs = posService.getSalesReconciliationRuns(tenant.id);
  res.json({ success: true, data: runs });
});

posRouter.post('/reconciliation/run', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const { legal_entity_id, branch_id, terminal_id, session_id } = req.body;
    const run = posService.runSalesReconciliation(
      tenant.id,
      legal_entity_id || 'le_default',
      branch_id,
      terminal_id,
      session_id,
      user.id
    );
    res.status(201).json({ success: true, data: run });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. OFFLINE SYNC FOUNDATION
// ==========================================

posRouter.get('/offline/devices', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const devices = posService.getOfflineDevices(tenant.id);
  res.json({ success: true, data: devices });
});

posRouter.post('/offline/register', requirePermission('manage', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const device = posService.registerOfflineDevice(tenant.id, req.body, user.id);
    res.status(201).json({ success: true, data: device });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.post('/offline/sync', requirePermission('create', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const { device_id, commands } = req.body;
    const result = posService.processOfflineSync(tenant.id, device_id, commands, user.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

posRouter.get('/offline/conflicts', requirePermission('view', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const conflicts = posService.getSyncConflicts(tenant.id);
  res.json({ success: true, data: conflicts });
});

posRouter.post('/offline/conflicts/:id/resolve', requirePermission('edit', 'pos'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const { resolution_policy } = req.body;
    const conflict = posService.resolveSyncConflict(tenant.id, req.params.id, resolution_policy, user.id);
    res.json({ success: true, data: conflict });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
