import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';

export const payablesRouter = Router();

// ==========================================
// 1. VENDOR BILLS
// ==========================================

payablesRouter.get('/bills', requirePermission('view', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const bills = Array.from(db.vendorBills.values())
    .filter(b => b.tenant_id === tenant.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  res.json({ success: true, data: bills });
});

payablesRouter.post('/bills', requirePermission('create', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const bill = db.createVendorBillDraft({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id
    });
    res.status(201).json({ success: true, data: bill });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

payablesRouter.post('/bills/:id/match', requirePermission('match', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const matchResult = db.performBillMatching(tenant.id, req.params.id);
    res.json({ success: true, data: matchResult });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

payablesRouter.post('/bills/:id/post', requirePermission('post', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const result = db.postVendorBill(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 2. VENDOR PAYMENTS
// ==========================================

payablesRouter.get('/payments', requirePermission('view', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const payments = Array.from(db.vendorPayments.values())
    .filter(p => p.tenant_id === tenant.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  res.json({ success: true, data: payments });
});

payablesRouter.post('/payments', requirePermission('create', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const payment = db.createVendorPayment({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

payablesRouter.post('/payments/:id/confirm', requirePermission('post', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const result = db.confirmVendorPayment(tenant.id, req.params.id, req.body.allocations || [], user.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 3. VENDOR LEDGER / PAYABLES
// ==========================================

payablesRouter.get('/ledger/:vendorId', requirePermission('view', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  
  try {
    const ledger = db.getVendorAPLedger(tenant.id, req.params.vendorId);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

// ==========================================
// 4. WRITE-OFFS
// ==========================================

payablesRouter.post('/write-offs', requirePermission('create', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const request = db.createAPWriteOffRequest({
      ...req.body,
      tenant_id: tenant.id,
      created_by: user.id
    });
    res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});

payablesRouter.post('/write-offs/:id/approve', requirePermission('approve', 'ap'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  
  try {
    const result = db.approveAndPostWriteOff(tenant.id, req.params.id, user.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, errors: [{ message: error.message }] });
  }
});
