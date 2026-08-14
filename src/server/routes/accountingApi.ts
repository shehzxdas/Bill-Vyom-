/**
 * Bill Vyom — Phase 3 Accounting Core & Double-Entry Ledger API Router
 */

import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';

export const accountingRouter = Router();

// ==========================================
// ACCOUNTING BOOKS & FISCAL CALENDARS
// ==========================================

accountingRouter.get('/books', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const legalEntityId = req.query.legal_entity_id as string;

    if (legalEntityId) {
      const book = db.getOrCreateDefaultAccountingBook(tenantId, legalEntityId);
      return res.json({ success: true, data: [book] });
    }

    const legalEntities = db.getLegalEntitiesByTenant(tenantId);
    const books = legalEntities.map((le) => db.getOrCreateDefaultAccountingBook(tenantId, le.id));

    res.json({ success: true, data: books });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.get('/calendars', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const legalEntities = db.getLegalEntitiesByTenant(tenantId);

    const result = legalEntities.map((le) => {
      const { calendar, fiscalYear, periods } = db.getOrCreateDefaultFiscalCalendar(tenantId, le.id);
      return {
        legal_entity: le,
        calendar,
        fiscal_year: fiscalYear,
        periods,
      };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.post('/periods/:id/status', requirePermission('manage', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const periodId = req.params.id;
    const { status } = req.body;

    if (!['OPEN', 'SOFT_CLOSE', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Allowed: OPEN, SOFT_CLOSE, CLOSED' });
    }

    const period = db.fiscalPeriods.get(periodId);
    if (!period || period.tenant_id !== tenantId) {
      return res.status(404).json({ success: false, error: 'Fiscal period not found.' });
    }

    period.status = status;
    period.updated_at = new Date().toISOString();
    if (status === 'CLOSED') {
      period.closed_at = new Date().toISOString();
      period.closed_by = req.context!.user.id;
    }

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: req.context!.user.id,
      actor_email: req.context!.user.email,
      action: 'ACCOUNTING.PERIOD_STATUS_UPDATED',
      resource_type: 'fiscal_period',
      resource_id: period.id,
      changes: { new_status: status },
    });

    res.json({ success: true, data: period });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// CHART OF ACCOUNTS
// ==========================================

accountingRouter.get('/accounts', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const legalEntityId = req.query.legal_entity_id as string;
    const bookId = req.query.accounting_book_id as string;

    const accounts = db.getAccounts(tenantId, legalEntityId, bookId);
    res.json({ success: true, data: accounts });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.post('/accounts', requirePermission('manage', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const {
      legal_entity_id,
      code,
      name,
      account_type,
      account_subtype,
      parent_account_id,
      normal_balance,
      currency_policy,
      single_currency_code,
      description,
      posting_allowed,
    } = req.body;

    if (!legal_entity_id || !code || !name || !account_type || !normal_balance) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: legal_entity_id, code, name, account_type, normal_balance',
      });
    }

    const account = db.createAccount({
      tenant_id: tenantId,
      legal_entity_id,
      code,
      name,
      account_type,
      account_subtype: account_subtype || 'OTHER_ASSET',
      parent_account_id: parent_account_id || null,
      normal_balance,
      currency_policy: currency_policy || 'MULTI_CURRENCY',
      single_currency_code: single_currency_code || null,
      description: description || '',
      posting_allowed: posting_allowed !== undefined ? Boolean(posting_allowed) : true,
      created_by: req.context!.user.id,
    });

    res.status(201).json({ success: true, data: account });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.put('/accounts/:id', requirePermission('manage', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const accountId = req.params.id;

    const updated = db.updateAccount(tenantId, accountId, req.body, req.context!.user.id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// JOURNAL ENTRIES & POSTING ENGINE
// ==========================================

accountingRouter.get('/journals', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const legalEntityId = req.query.legal_entity_id as string;
    const status = req.query.status as string;
    const sourceType = req.query.source_type as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);

    let entries = Array.from(db.journalEntries.values()).filter(
      (e) => e.tenant_id === tenantId && e.deleted_at === null
    );

    if (legalEntityId) {
      entries = entries.filter((e) => e.legal_entity_id === legalEntityId);
    }
    if (status) {
      entries = entries.filter((e) => e.status === status);
    }
    if (sourceType) {
      entries = entries.filter((e) => e.source_type === sourceType);
    }
    if (startDate) {
      entries = entries.filter((e) => e.transaction_date >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.transaction_date <= endDate);
    }

    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = entries.length;
    const startIndex = (page - 1) * limit;
    const paginated = entries.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.get('/journals/:id', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const entry = db.journalEntries.get(req.params.id);

    if (!entry || entry.tenant_id !== tenantId || entry.deleted_at !== null) {
      return res.status(404).json({ success: false, error: 'Journal entry not found.' });
    }

    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.post('/journals/draft', requirePermission('manage', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const { legal_entity_id, description, lines, transaction_date, currency_code, exchange_rate, reference } = req.body;

    if (!legal_entity_id || !description) {
      return res.status(400).json({ success: false, error: 'Missing legal_entity_id or description.' });
    }

    const draft = db.createJournalDraft({
      tenant_id: tenantId,
      legal_entity_id,
      description,
      lines: lines || [],
      transaction_date,
      currency_code,
      exchange_rate,
      reference,
      created_by: req.context!.user.id,
    });

    res.status(201).json({ success: true, data: draft });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.post('/journals/post', requirePermission('manage', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotency_key;

    const posted = db.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: req.body.legal_entity_id,
      description: req.body.description,
      lines: req.body.lines,
      transaction_date: req.body.transaction_date,
      currency_code: req.body.currency_code,
      exchange_rate: req.body.exchange_rate,
      reference: req.body.reference,
      posted_by: req.context!.user.id,
      idempotency_key: idempotencyKey,
      id: req.body.id,
    });

    res.status(200).json({ success: true, data: posted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.post('/journals/:id/reverse', requirePermission('manage', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const journalId = req.params.id;
    const { reason } = req.body;

    const result = db.reverseJournalEntry(tenantId, journalId, req.context!.user.id, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// REPORTS: TRIAL BALANCE & GENERAL LEDGER
// ==========================================

accountingRouter.get('/reports/trial-balance', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const legalEntityId = req.query.legal_entity_id as string;
    const bookId = req.query.accounting_book_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!legalEntityId) {
      const les = db.getLegalEntitiesByTenant(tenantId);
      if (les.length === 0) {
        return res.status(400).json({ success: false, error: 'No legal entity found for tenant.' });
      }
      const report = db.calculateTrialBalance(tenantId, les[0].id, bookId, startDate, endDate);
      return res.json({ success: true, data: report });
    }

    const report = db.calculateTrialBalance(tenantId, legalEntityId, bookId, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

accountingRouter.get('/reports/general-ledger', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const accountId = req.query.account_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10);

    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing account_id parameter.' });
    }

    const statement = db.queryGeneralLedger(tenantId, accountId, startDate, endDate, page, limit);
    res.json({ success: true, data: statement });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// ACCOUNTING DIMENSIONS
// ==========================================

accountingRouter.get('/dimensions', requirePermission('read', 'accounting'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const dims = Array.from(db.accountingDimensions.values()).filter(
      (d) => d.tenant_id === tenantId && d.deleted_at === null
    );

    if (dims.length === 0) {
      // Default dimensions
      const defaultKeys = [
        { key: 'branch_id', name: 'Branch' },
        { key: 'cost_center', name: 'Cost Center' },
        { key: 'department', name: 'Department' },
        { key: 'project', name: 'Project' },
      ];
      const now = new Date().toISOString();
      for (const k of defaultKeys) {
        const dim = {
          id: `dim_${k.key}`,
          tenant_id: tenantId,
          dimension_key: k.key,
          dimension_name: k.name,
          status: 'ACTIVE' as const,
          created_at: now,
          updated_at: now,
          created_by: 'system',
          updated_by: 'system',
          deleted_at: null,
          version: 1,
        };
        db.accountingDimensions.set(dim.id, dim);
        dims.push(dim);
      }
    }

    res.json({ success: true, data: dims });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
