/**
 * Bill Vyom — Phase 8 Global Inventory & Warehouse Management API Gateway
 */

import { Router, Response } from 'express';
import { db } from '../db';
import { inventoryService } from '../services/inventoryService';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';
import { Decimal } from '../../domain/decimal';

export const inventoryRouter = Router();

// ==========================================
// 1. INVENTORY DASHBOARD METRICS
// ==========================================

inventoryRouter.get('/dashboard', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const balances = inventoryService.getAllStockBalances(tenant.id);
  const movements = Array.from(db.inventoryMovements.values()).filter((m) => m.tenant_id === tenant.id && m.deleted_at === null);
  const reservations = Array.from(db.stockReservations.values()).filter((r) => r.tenant_id === tenant.id && r.status === 'RESERVED' && r.deleted_at === null);
  const transfers = Array.from(db.stockTransfers.values()).filter((t) => t.tenant_id === tenant.id && t.status === 'IN_TRANSIT' && t.deleted_at === null);
  const counts = Array.from(db.stockCounts.values()).filter((c) => c.tenant_id === tenant.id && c.status !== 'POSTED' && c.deleted_at === null);
  const adjustments = Array.from(db.stockAdjustments.values()).filter((a) => a.tenant_id === tenant.id && a.status === 'PENDING_APPROVAL' && a.deleted_at === null);
  const lots = Array.from(db.lotBatches.values()).filter((l) => l.tenant_id === tenant.id && l.deleted_at === null);

  let totalValuation = Decimal.zero(2);
  let totalOnHand = 0;
  let totalAvailable = 0;
  let totalReserved = 0;
  let totalQuarantined = 0;
  let lowStockAlerts = 0;

  for (const b of balances) {
    totalValuation = totalValuation.add(new Decimal(b.total_valuation || '0'));
    totalOnHand += b.on_hand_quantity;
    totalAvailable += b.available_quantity;
    totalReserved += b.reserved_quantity;
    totalQuarantined += b.quarantined_quantity;
    if (b.available_quantity <= 5) {
      lowStockAlerts++;
    }
  }

  const expiringLots = lots.filter((l) => l.status === 'EXPIRING' || l.status === 'EXPIRED').length;

  res.json({
    success: true,
    data: {
      metrics: {
        total_valuation: totalValuation.toString(2),
        total_on_hand: totalOnHand,
        total_available: totalAvailable,
        total_reserved: totalReserved,
        total_quarantined: totalQuarantined,
        total_sku_count: balances.length,
        low_stock_alerts: lowStockAlerts,
        active_reservations: reservations.length,
        in_transit_transfers: transfers.length,
        pending_counts: counts.length,
        pending_adjustments: adjustments.length,
        expiring_lots_count: expiringLots,
      },
      recent_movements: movements.slice(-10).reverse(),
    },
  });
});

// ==========================================
// 2. STOCK BALANCES & LEDGER MOVEMENTS
// ==========================================

inventoryRouter.get('/stock', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const warehouseId = req.query.warehouse_id as string | undefined;
  const balances = inventoryService.getAllStockBalances(tenant.id, warehouseId);

  // Enrich with product and warehouse names
  const enriched = balances.map((b) => {
    const prod = db.getProductById(tenant.id, b.product_id);
    const wh = db.warehouses.get(b.warehouse_id);
    const loc = b.location_id ? db.warehouseLocations.get(b.location_id) : null;
    return {
      ...b,
      product_name: prod?.name || b.sku,
      warehouse_name: wh?.warehouse_name || 'Warehouse',
      location_code: loc?.location_code || 'Main Storage',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.get('/movements', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const productId = req.query.product_id as string | undefined;
  const warehouseId = req.query.warehouse_id as string | undefined;
  const movementType = req.query.movement_type as string | undefined;

  let movements = Array.from(db.inventoryMovements.values()).filter(
    (m) =>
      m.tenant_id === tenant.id &&
      m.deleted_at === null &&
      (!productId || m.product_id === productId) &&
      (!warehouseId || m.warehouse_id === warehouseId) &&
      (!movementType || m.movement_type === movementType)
  );

  movements.sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime());

  // Enrich with product & warehouse names
  const enriched = movements.map((m) => {
    const prod = db.getProductById(tenant.id, m.product_id);
    const wh = db.warehouses.get(m.warehouse_id);
    return {
      ...m,
      product_name: prod?.name || m.sku,
      warehouse_name: wh?.warehouse_name || 'Warehouse',
    };
  });

  res.json({ success: true, data: enriched });
});

// Record direct movement (Ad-hoc receipt, issue, damage, quarantine, etc.)
inventoryRouter.post('/movements', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const result = inventoryService.recordInventoryMovement({
      ...req.body,
      tenant_id: tenant.id,
      legal_entity_id: req.body.legal_entity_id || legalEntity.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 3. WAREHOUSES & LOCATIONS
// ==========================================

inventoryRouter.get('/zones', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const warehouseId = req.query.warehouse_id as string | undefined;
  const zones = inventoryService.getZones(tenant.id, warehouseId);
  res.json({ success: true, data: zones });
});

inventoryRouter.post('/zones', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const zone = inventoryService.createZone({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.get('/locations', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const warehouseId = req.query.warehouse_id as string | undefined;
  const locations = inventoryService.getLocations(tenant.id, warehouseId);

  const enriched = locations.map((loc) => {
    const wh = db.warehouses.get(loc.warehouse_id);
    const zone = loc.zone_id ? db.warehouseZones.get(loc.zone_id) : null;
    return {
      ...loc,
      warehouse_name: wh?.warehouse_name || 'Warehouse',
      zone_name: zone?.zone_name || 'General Zone',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/locations', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const location = inventoryService.createLocation({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 4. LOT/BATCHES & SERIAL NUMBERS
// ==========================================

inventoryRouter.get('/lots', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const productId = req.query.product_id as string | undefined;
  const lots = inventoryService.getLotBatches(tenant.id, productId);

  const enriched = lots.map((l) => {
    const prod = db.getProductById(tenant.id, l.product_id);
    return {
      ...l,
      product_name: prod?.name || l.sku,
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/lots', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const lot = inventoryService.createLotBatch({
      ...req.body,
      tenant_id: tenant.id,
      legal_entity_id: req.body.legal_entity_id || legalEntity.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: lot });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.get('/serials', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const productId = req.query.product_id as string | undefined;
  const serials = inventoryService.getSerialNumbers(tenant.id, productId);

  const enriched = serials.map((s) => {
    const prod = db.getProductById(tenant.id, s.product_id);
    const wh = s.current_warehouse_id ? db.warehouses.get(s.current_warehouse_id) : null;
    return {
      ...s,
      product_name: prod?.name || s.sku,
      warehouse_name: wh?.warehouse_name || 'Unassigned',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/serials', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const serial = inventoryService.registerSerialNumber({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: serial });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 5. STOCK RESERVATIONS
// ==========================================

inventoryRouter.get('/reservations', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const reservations = Array.from(db.stockReservations.values()).filter(
    (r) => r.tenant_id === tenant.id && r.deleted_at === null
  );

  const enriched = reservations.map((r) => {
    const prod = db.getProductById(tenant.id, r.product_id);
    const wh = db.warehouses.get(r.warehouse_id);
    return {
      ...r,
      product_name: prod?.name || r.sku,
      warehouse_name: wh?.warehouse_name || 'Warehouse',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/reservations', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const reservation = inventoryService.createReservation({
      ...req.body,
      tenant_id: tenant.id,
      legal_entity_id: req.body.legal_entity_id || legalEntity.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: reservation });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.post('/reservations/:id/release', requirePermission('edit', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const result = inventoryService.releaseReservation(
      tenant.id,
      req.params.id,
      req.body.quantity_to_release,
      user.id
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 6. STOCK TRANSFERS
// ==========================================

inventoryRouter.get('/transfers', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const transfers = Array.from(db.stockTransfers.values()).filter(
    (t) => t.tenant_id === tenant.id && t.deleted_at === null
  );

  const enriched = transfers.map((t) => {
    const sWh = db.warehouses.get(t.source_warehouse_id);
    const dWh = db.warehouses.get(t.destination_warehouse_id);
    return {
      ...t,
      source_warehouse_name: sWh?.warehouse_name || 'Source Warehouse',
      destination_warehouse_name: dWh?.warehouse_name || 'Destination Warehouse',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/transfers', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const transfer = inventoryService.createStockTransfer({
      ...req.body,
      tenant_id: tenant.id,
      source_legal_entity_id: req.body.source_legal_entity_id || legalEntity.id,
      destination_legal_entity_id: req.body.destination_legal_entity_id || legalEntity.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.post('/transfers/:id/ship', requirePermission('edit', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const transfer = inventoryService.shipStockTransfer(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: transfer });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.post('/transfers/:id/receive', requirePermission('edit', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const transfer = inventoryService.receiveStockTransfer(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: transfer });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 7. STOCK ADJUSTMENTS
// ==========================================

inventoryRouter.get('/adjustments', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const adjustments = Array.from(db.stockAdjustments.values()).filter(
    (a) => a.tenant_id === tenant.id && a.deleted_at === null
  );

  const enriched = adjustments.map((adj) => {
    const wh = db.warehouses.get(adj.warehouse_id);
    return {
      ...adj,
      warehouse_name: wh?.warehouse_name || 'Warehouse',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/adjustments', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const adjustment = inventoryService.createStockAdjustment({
      ...req.body,
      tenant_id: tenant.id,
      legal_entity_id: req.body.legal_entity_id || legalEntity.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: adjustment });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.post('/adjustments/:id/approve', requirePermission('approve', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const adjustment = inventoryService.approveAndPostAdjustment(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: adjustment });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 8. STOCK COUNTS & CYCLE COUNTS
// ==========================================

inventoryRouter.get('/counts', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const counts = Array.from(db.stockCounts.values()).filter(
    (c) => c.tenant_id === tenant.id && c.deleted_at === null
  );

  const enriched = counts.map((c) => {
    const wh = db.warehouses.get(c.warehouse_id);
    return {
      ...c,
      warehouse_name: wh?.warehouse_name || 'Warehouse',
    };
  });

  res.json({ success: true, data: enriched });
});

inventoryRouter.post('/counts', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const count = inventoryService.createStockCount({
      ...req.body,
      tenant_id: tenant.id,
      legal_entity_id: req.body.legal_entity_id || legalEntity.id,
      created_by: user.id,
    });
    res.status(201).json({ success: true, data: count });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.post('/counts/:id/record-line', requirePermission('create', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const count = inventoryService.recordCountLine({
      tenant_id: tenant.id,
      count_id: req.params.id,
      line_id: req.body.line_id,
      counted_quantity: Number(req.body.counted_quantity),
      counted_by: user.id,
    });
    res.json({ success: true, data: count });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

inventoryRouter.post('/counts/:id/approve', requirePermission('approve', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const result = inventoryService.approveAndPostStockCount(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 9. INVENTORY VALUATION REPORT
// ==========================================

inventoryRouter.get('/valuation/report', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const warehouseId = req.query.warehouse_id as string | undefined;
  const report = inventoryService.getValuationReport(tenant.id, warehouseId);
  res.json({ success: true, data: report });
});

// ==========================================
// 10. INVENTORY RECONCILIATION
// ==========================================

inventoryRouter.get('/reconciliations', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const runs = Array.from(db.inventoryReconciliationRuns.values()).filter(
    (r) => r.tenant_id === tenant.id && r.deleted_at === null
  );
  runs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ success: true, data: runs });
});

inventoryRouter.post('/reconciliations/run', requirePermission('reconcile', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, legalEntity } = req.context!;
  try {
    const run = inventoryService.runReconciliation(
      tenant.id,
      req.body.legal_entity_id || legalEntity.id,
      req.body.warehouse_id,
      user.id
    );
    res.status(201).json({ success: true, data: run });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 11. REBUILD PROJECTIONS (ADMIN/AUDIT)
// ==========================================

inventoryRouter.post('/rebuild-projections', requirePermission('manage', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, legalEntity } = req.context!;
  try {
    const result = inventoryService.rebuildStockBalances(tenant.id, req.body.legal_entity_id || legalEntity.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 12. INVENTORY POLICY SETTINGS
// ==========================================

inventoryRouter.get('/settings', requirePermission('view', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const settings = inventoryService.getPolicySettings(tenant.id);
  res.json({ success: true, data: settings });
});

inventoryRouter.post('/settings', requirePermission('edit', 'inventory'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  try {
    const updated = inventoryService.updatePolicySettings(tenant.id, req.body, user.id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});
