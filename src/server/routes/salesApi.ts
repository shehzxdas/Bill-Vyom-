/**
 * Bill Vyom — Phase 4 Sales Engine & Invoice Transaction API Router
 */

import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';

export const salesRouter = Router();

// ==========================================
// SALES OVERVIEW & PRICING UTILITIES
// ==========================================

salesRouter.get('/overview', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const legalEntityId = req.query.legal_entity_id as string | undefined;

    const overview = db.getSalesDashboardOverview(tenantId, legalEntityId);
    res.json({ success: true, data: overview });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/pricing/resolve', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const customerId = req.query.customer_id as string;
    const productId = req.query.product_id as string;
    const variantId = req.query.variant_id as string | undefined;
    const currencyCode = (req.query.currency_code as string) || 'INR';
    const qty = parseInt((req.query.quantity as string) || '1', 10);

    if (!customerId || !productId) {
      return res.status(400).json({ success: false, error: 'customer_id and product_id are required' });
    }

    const priceRes = db.resolvePrice(tenantId, customerId, productId, variantId, currencyCode, qty);
    const taxRes = db.calculateTax(tenantId, productId);

    res.json({
      success: true,
      data: {
        unit_price: priceRes.unit_price,
        price_list_id: priceRes.price_list_id,
        tax_classification_code: taxRes.tax_classification_code,
        tax_rate: taxRes.tax_rate,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// QUOTATION ENGINE
// ==========================================

salesRouter.get('/quotations', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getQuotations(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/quotations/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const quotation = db.getQuotationById(tenantId, req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/quotations/:id/versions', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const versions = db.getQuotationVersions(tenantId, req.params.id);
    res.json({ success: true, data: versions });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/quotations', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const quotation = db.createQuotation({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/quotations/:id/status', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }

    const quotation = db.updateQuotationStatus(tenantId, req.params.id, status, userId);
    res.json({ success: true, data: quotation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/quotations/:id/convert', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const salesOrder = db.convertQuotationToSalesOrder(tenantId, req.params.id, userId);
    res.json({ success: true, data: salesOrder });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// SALES ORDER ENGINE
// ==========================================

salesRouter.get('/orders', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getSalesOrders(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/orders/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const order = db.getSalesOrderById(tenantId, req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Sales Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/orders', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const salesOrder = db.createSalesOrder({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });

    res.status(201).json({ success: true, data: salesOrder });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/orders/:id/status', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }

    const order = db.updateSalesOrderStatus(tenantId, req.params.id, status, userId);
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/orders/:id/convert', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const invoice = db.convertSalesOrderToInvoice(tenantId, req.params.id, userId);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// INVOICE ENGINE & ATOMIC GL POSTING
// ==========================================

salesRouter.get('/invoices', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getInvoices(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/invoices/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const invoice = db.getInvoiceById(tenantId, req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/invoices', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const invoice = db.createInvoiceDraft({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/invoices/:id/post', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotency_key;

    const invoice = db.postInvoice(tenantId, req.params.id, userId, idempotencyKey);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/invoices/:id/void', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'reason is required to void an invoice' });
    }

    const invoice = db.voidInvoice(tenantId, req.params.id, reason, userId);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// FULFILLMENT / DELIVERY FOUNDATION
// ==========================================

salesRouter.get('/fulfillments', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getFulfillments(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/fulfillments/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const fulfillment = db.getFulfillmentById(tenantId, req.params.id);
    if (!fulfillment) {
      return res.status(404).json({ success: false, error: 'Fulfillment not found' });
    }
    res.json({ success: true, data: fulfillment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/fulfillments', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const fulfillment = db.createFulfillment({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });
    res.status(201).json({ success: true, data: fulfillment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// CREDIT NOTES ENGINE
// ==========================================

salesRouter.get('/credit-notes', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getCreditNotes(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/credit-notes/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const creditNote = db.getCreditNoteById(tenantId, req.params.id);
    if (!creditNote) {
      return res.status(404).json({ success: false, error: 'Credit Note not found' });
    }
    res.json({ success: true, data: creditNote });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/credit-notes', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const creditNote = db.createCreditNoteDraft({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });
    res.status(201).json({ success: true, data: creditNote });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/credit-notes/:id/post', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const { idempotency_key } = req.body;

    const posted = db.postCreditNote(tenantId, req.params.id, userId, idempotency_key);
    res.json({ success: true, data: posted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// DEBIT NOTES ENGINE
// ==========================================

salesRouter.get('/debit-notes', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getDebitNotes(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/debit-notes/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const debitNote = db.getDebitNoteById(tenantId, req.params.id);
    if (!debitNote) {
      return res.status(404).json({ success: false, error: 'Debit Note not found' });
    }
    res.json({ success: true, data: debitNote });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/debit-notes', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const debitNote = db.createDebitNoteDraft({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });
    res.status(201).json({ success: true, data: debitNote });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/debit-notes/:id/post', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const { idempotency_key } = req.body;

    const posted = db.postDebitNote(tenantId, req.params.id, userId, idempotency_key);
    res.json({ success: true, data: posted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// SALES RETURNS FOUNDATION
// ==========================================

salesRouter.get('/returns', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const status = req.query.status as string | undefined;
    const query = req.query.query as string | undefined;

    const result = db.getSalesReturns(tenantId, { page, limit, status, query });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/returns/:id', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const salesReturn = db.getSalesReturnById(tenantId, req.params.id);
    if (!salesReturn) {
      return res.status(404).json({ success: false, error: 'Sales Return not found' });
    }
    res.json({ success: true, data: salesReturn });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/returns', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const salesReturn = db.createSalesReturn({
      ...req.body,
      tenant_id: tenantId,
      created_by: userId,
    });
    res.status(201).json({ success: true, data: salesReturn });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/returns/:id/approve', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;

    const approved = db.approveSalesReturn(tenantId, req.params.id, userId);
    res.json({ success: true, data: approved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// COMPLEMENTARY AUDIT, HISTORY, SNAPSHOTS, ATTACHMENTS
// ==========================================

salesRouter.get('/documents/:id/snapshots', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const snapshot = db.getDocumentSnapshotByDocumentId(tenantId, req.params.id);
    res.json({ success: true, data: snapshot || null });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/documents/:id/histories', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const histories = db.getDocumentStatusHistoryByDocumentId(tenantId, req.params.id);
    res.json({ success: true, data: histories });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/documents/:id/attachments', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const attachments = db.getDocumentAttachmentsByDocumentId(tenantId, req.params.id);
    res.json({ success: true, data: attachments });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.post('/documents/:id/attachments', requirePermission('write', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const userId = req.context!.user.id;
    const { document_type, file_name, file_path, file_size, mime_type } = req.body;

    if (!document_type || !file_name || !file_path) {
      return res.status(400).json({ success: false, error: 'document_type, file_name, file_path are required.' });
    }

    const attachment = db.createDocumentAttachment({
      tenant_id: tenantId,
      document_type,
      document_id: req.params.id,
      file_name,
      file_path,
      file_size: file_size || 0,
      mime_type: mime_type || 'application/octet-stream',
      uploaded_by: userId,
    });
    res.status(201).json({ success: true, data: attachment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

salesRouter.get('/customers/:id/credit-evaluation', requirePermission('read', 'sales'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.context!.tenant.id;
    const orderTotal = (req.query.order_total as string) || '0.00';
    const status = db.evaluateCustomerCredit(tenantId, req.params.id, orderTotal);
    res.json({ success: true, data: { status } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
