import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';

export const procurementRouter = Router();

// ==========================================
// 1. PURCHASE REQUISITIONS
// ==========================================

procurementRouter.get('/requisitions', requirePermission('view', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const requisitions = Array.from(db.purchaseRequisitions.values())
    .filter(pr => pr.tenant_id === tenant.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  res.json({ success: true, data: requisitions });
});

procurementRouter.post('/requisitions', requirePermission('create', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const requisition = db.createPurchaseRequisition({
      ...req.body,
      tenant_id: tenant.id,
      requester_id: user.id
    });
    res.status(201).json({ success: true, data: requisition });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

procurementRouter.post('/requisitions/:id/status', requirePermission('approve', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const requisition = db.updatePurchaseRequisitionStatus(
      tenant.id,
      req.params.id,
      req.body.status,
      user.id
    );
    res.json({ success: true, data: requisition });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 2. PURCHASE ORDERS
// ==========================================

procurementRouter.get('/purchase-orders', requirePermission('view', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const pos = Array.from(db.purchaseOrders.values())
    .filter(po => po.tenant_id === tenant.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  res.json({ success: true, data: pos });
});

procurementRouter.post('/purchase-orders', requirePermission('create', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const po = db.createPurchaseOrder({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id
    });
    res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

procurementRouter.post('/purchase-orders/:id/status', requirePermission('approve', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const po = db.updatePurchaseOrderStatus(
      tenant.id,
      req.params.id,
      req.body.status,
      user.id
    );
    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 3. GOODS RECEIPTS
// ==========================================

procurementRouter.get('/goods-receipts', requirePermission('view', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const receipts = Array.from(db.goodsReceipts.values())
    .filter(gr => gr.tenant_id === tenant.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  res.json({ success: true, data: receipts });
});

procurementRouter.post('/goods-receipts', requirePermission('create', 'procurement'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const gr = db.createGoodsReceipt({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id
    });
    res.status(201).json({ success: true, data: gr });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});
