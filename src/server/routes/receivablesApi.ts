/**
 * Bill Vyom — Phase 6 Accounts Receivable, Payments, Collections & Reconciliation API Router
 */

import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';

export const receivablesRouter = Router();

// ==========================================
// 1. RECEIVABLES ENGINE
// ==========================================

receivablesRouter.get('/', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const customerId = req.query.customer_id as string | undefined;
    const status = req.query.status as string | undefined;

    let list = Array.from(db.receivables.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null
    );

    if (customerId) {
      list = list.filter((r) => r.customer_id === customerId);
    }
    if (status) {
      list = list.filter((r) => r.status === status);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/rebuild', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'customer_id is required for rebuilding projections.' });
    }

    db.rebuildCustomerARProjections(tenantId, customer_id);

    res.json({ success: true, message: 'AR balances rebuilt successfully from transaction history.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/schedules', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.receivableSchedules.values()).filter(
      (s) => s.tenant_id === tenantId && s.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/aging-report', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const asOfDate = (req.query.as_of_date as string) || new Date().toISOString().split('T')[0];
    const report = db.getARAgingReport(tenantId, asOfDate);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/statement', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const customerId = req.query.customer_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!customerId || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'customer_id, start_date, and end_date are required.' });
    }

    const statement = db.getCustomerStatement(tenantId, customerId, startDate, endDate);
    res.json({ success: true, data: statement });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. CUSTOMER PAYMENT WORKFLOWS
// ==========================================

receivablesRouter.get('/payments', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const customerId = req.query.customer_id as string | undefined;
    const status = req.query.status as string | undefined;

    let list = Array.from(db.payments.values()).filter(
      (p) => p.tenant_id === tenantId && p.deleted_at === null
    );

    if (customerId) {
      list = list.filter((p) => p.customer_id === customerId);
    }
    if (status) {
      list = list.filter((p) => p.status === status);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/payments', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const {
      legal_entity_id,
      customer_id,
      payment_date,
      amount,
      currency_code,
      payment_method,
      payment_reference,
      bank_account_id,
      notes,
    } = req.body;

    if (!legal_entity_id || !customer_id || !payment_date || !amount || !currency_code || !payment_method || !bank_account_id) {
      return res.status(400).json({ success: false, error: 'Required payment parameters are missing (including bank_account_id).' });
    }

    const payment = db.createPayment(
      tenantId,
      {
        customer_id,
        legal_entity_id,
        payment_date,
        amount,
        currency_code,
        payment_method,
        payment_channel: 'manual',
        received_account_id: bank_account_id,
        reference: payment_reference || `REF-${Date.now()}`,
        notes,
      },
      actorId
    );

    res.status(201).json({ success: true, data: payment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/payments/:id/confirm', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;

    const payment = db.confirmPayment(
      tenantId,
      req.params.id,
      actorId
    );

    res.json({ success: true, data: payment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/payments/:id/allocate', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { allocations } = req.body; // Array of { receivable_id: string, amount: string }

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ success: false, error: 'allocations must be a non-empty array.' });
    }

    const payment = db.allocatePayment(tenantId, req.params.id, allocations, actorId);

    res.json({ success: true, data: payment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/payments/:id/reverse', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reversal reason is mandatory.' });
    }

    const payment = db.reversePayment(tenantId, req.params.id, reason, actorId);

    res.json({ success: true, data: payment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/payments/:id/refund', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { refund_amount, notes } = req.body;

    if (!refund_amount) {
      return res.status(400).json({ success: false, error: 'refund_amount is required.' });
    }

    const refund = db.createRefund(
      tenantId,
      req.params.id,
      refund_amount,
      notes || 'Refund issued',
      'Bank Transfer',
      actorId
    );

    res.status(201).json({ success: true, data: refund });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. CREDIT CONTROL & SEGREGATED PROFILES
// ==========================================

receivablesRouter.get('/credit-profiles', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.customerCreditProfiles.values()).filter(
      (p) => p.tenant_id === tenantId && p.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/promises', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.promisesToPay.values()).filter(
      (p) => p.tenant_id === tenantId && p.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/credit-profiles/:customerId', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const { customerId } = req.params;

    const profile = db.getCustomerCreditProfile(tenantId, customerId);
    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.put('/credit-profiles/:customerId', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { customerId } = req.params;
    const { credit_limit, credit_days, credit_status, risk_classification } = req.body;

    const profile = db.updateCustomerCreditProfile(
      tenantId,
      customerId,
      {
        credit_limit,
        credit_days: credit_days !== undefined ? Number(credit_days) : undefined,
        credit_status,
        risk_classification,
      },
      actorId
    );

    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/credit-holds', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { customer_id, reason } = req.body;

    if (!customer_id || !reason) {
      return res.status(400).json({ success: false, error: 'customer_id and reason are required.' });
    }

    const hold = db.createCreditHold(tenantId, customer_id, reason, actorId);

    res.status(201).json({ success: true, data: hold });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/credit-holds/release', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { customer_id, reason } = req.body;

    if (!customer_id || !reason) {
      return res.status(400).json({ success: false, error: 'customer_id and release reason are required.' });
    }

    const release = db.releaseCreditHold(tenantId, customer_id, reason, actorId);

    res.json({ success: true, data: release });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/credit-holds', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.creditHolds.values()).filter(
      (h) => h.tenant_id === tenantId && h.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. ACTIVE COLLECTIONS CASE MANAGEMENT
// ==========================================

receivablesRouter.get('/collection-cases', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const status = req.query.status as string | undefined;

    let list = Array.from(db.collectionCases.values()).filter(
      (c) => c.tenant_id === tenantId && c.deleted_at === null
    );

    if (status) {
      list = list.filter((c) => c.status === status);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/collection-cases', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { customer_id, priority } = req.body;

    if (!customer_id || !priority) {
      return res.status(400).json({ success: false, error: 'customer_id and priority are required.' });
    }

    const colCase = db.createCollectionCase(tenantId, customer_id, priority, actorId);

    res.status(201).json({ success: true, data: colCase });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/collection-cases/:id/activities', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { activity_type, summary, notes } = req.body;

    if (!activity_type || !summary) {
      return res.status(400).json({ success: false, error: 'activity_type and summary are required.' });
    }

    const activity = db.createCollectionActivity(
      tenantId,
      req.params.id,
      { activity_type, summary, notes },
      actorId
    );

    res.status(201).json({ success: true, data: activity });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/collection-cases/:id/activities', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.collectionActivities.values()).filter(
      (a) => a.tenant_id === tenantId && a.case_id === req.params.id && a.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/collection-cases/:id/promises', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { customer_id, receivable_id, promised_amount, promised_date, notes } = req.body;

    if (!customer_id || !receivable_id || !promised_amount || !promised_date) {
      return res.status(400).json({ success: false, error: 'customer_id, receivable_id, promised_amount, and promised_date are required.' });
    }

    const promise = db.createPromiseToPay(
      tenantId,
      customer_id,
      receivable_id,
      promised_amount,
      promised_date,
      notes,
      actorId
    );

    res.status(201).json({ success: true, data: promise });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/collection-cases/:id/promises', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const colCase = db.collectionCases.get(req.params.id);
    if (!colCase || colCase.tenant_id !== tenantId) {
      return res.status(404).json({ success: false, error: 'Collection case not found.' });
    }

    const list = Array.from(db.promisesToPay.values()).filter(
      (p) => p.tenant_id === tenantId && p.customer_id === colCase.customer_id && p.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. DEBT WRITE-OFF ENGINE
// ==========================================

receivablesRouter.get('/write-offs', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.writeOffRequests.values()).filter(
      (w) => w.tenant_id === tenantId && w.deleted_at === null
    );
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/write-offs', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;
    const { receivable_id, write_off_amount, reason } = req.body;

    if (!receivable_id || !write_off_amount || !reason) {
      return res.status(400).json({ success: false, error: 'receivable_id, write_off_amount, and reason are required.' });
    }

    const rec = db.getReceivableById(tenantId, receivable_id);
    if (!rec) {
      return res.status(404).json({ success: false, error: 'Receivable not found.' });
    }

    const request = db.createWriteOffRequest(tenantId, rec.customer_id, receivable_id, write_off_amount, reason, actorId);

    res.status(201).json({ success: true, data: request });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/write-offs/:id/approve', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;

    const posted = db.approveAndPostWriteOff(tenantId, req.params.id, actorId);

    res.json({ success: true, data: posted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. BANK & ACCOUNTING RECONCILIATION RUNS
// ==========================================

receivablesRouter.get('/reconciliations', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.arReconciliationRuns.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null
    );
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.post('/reconciliations/run', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const actorId = req.context!.user.id;

    const result = db.runARReconciliation(tenantId, actorId);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

receivablesRouter.get('/reconciliations/:id/exceptions', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const list = Array.from(db.arReconciliationExceptions.values()).filter(
      (e) => e.tenant_id === tenantId && e.run_id === req.params.id && e.deleted_at === null
    );
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
