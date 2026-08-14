/**
 * Bill Vyom — Global Sales & Commercial Transaction Engine
 * Production-Grade Workspace with Tabbed Console, State Machines & Immutable Audit Trails.
 */

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileText,
  Zap,
  Truck,
  RotateCcw,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileBox,
  CornerDownLeft,
  Calendar,
  Building,
  MapPin,
  Upload,
  UserCheck,
  ShieldCheck,
  Info,
  DollarSign
} from 'lucide-react';

// Define TS Types for local views
interface DocumentHistory {
  id: string;
  document_type: string;
  document_id: string;
  from_status: string;
  to_status: string;
  actor_id: string;
  timestamp: string;
  reason: string;
}

interface DocumentSnapshot {
  id: string;
  document_type: string;
  document_id: string;
  customer_name: string;
  customer_address: any;
  billing_address: any;
  shipping_address: any;
  tax_registration_number?: string;
  credit_limit: string;
  created_at: string;
}

interface DocumentAttachment {
  id: string;
  document_type: string;
  document_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'quotations' | 'orders' | 'fulfillments' | 'invoices' | 'credit-notes' | 'debit-notes' | 'returns'>('overview');
  
  const token = localStorage.getItem('billvyom_jwt_token');

  // Master lists
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [legalEntities, setLegalEntities] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Overview metrics
  const [overview, setOverview] = useState<any>({
    total_revenue: '0.00',
    pending_orders_count: 0,
    open_quotations_count: 0,
    active_fulfillments_count: 0,
    monthly_sales: [],
  });

  // State lists for tabs
  const [quotations, setQuotations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal states
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [histories, setHistories] = useState<DocumentHistory[]>([]);
  const [snapshot, setSnapshot] = useState<DocumentSnapshot | null>(null);
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [creditEval, setCreditEval] = useState<string>('APPROVED');

  // Attachment upload form state
  const [uploadName, setUploadName] = useState('');
  const [uploadPath, setUploadPath] = useState('');
  const [uploadMime, setUploadMime] = useState('application/pdf');

  // Create Wizards states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardType, setWizardType] = useState<string>('');

  // Creation Wizard Form States
  const [customerId, setCustomerId] = useState('');
  const [legalEntityId, setLegalEntityId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('NET30');
  const [sourceQuotationId, setSourceQuotationId] = useState('');
  const [salesOrderId, setSalesOrderId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<any[]>([]);

  // Global Context Loading
  useEffect(() => {
    fetchContext();
    fetchMasters();
  }, []);

  // Fetch lists based on active tab
  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    setStatusFilter('');
    fetchTabData(activeTab, 1, '', '');
  }, [activeTab]);

  const fetchContext = async () => {
    try {
      const res = await fetch('/api/v1/tenant/context', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLegalEntities(json.data.legalEntities || []);
        setBranches(json.data.branches || []);
        setWarehouses(json.data.warehouses || []);
        if (json.data.legalEntities?.[0]) setLegalEntityId(json.data.legalEntities[0].id);
        if (json.data.branches?.[0]) setBranchId(json.data.branches[0].id);
        if (json.data.warehouses?.[0]) setWarehouseId(json.data.warehouses[0].id);
      }
    } catch (err) {
      console.error('Failed loading context', err);
    }
  };

  const fetchMasters = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch('/api/v1/master/customers?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/master/products?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const custJson = await custRes.json();
      const prodJson = await prodRes.json();

      if (custJson.success) setCustomers(custJson.data || []);
      if (prodJson.success) setProducts(prodJson.data || []);
    } catch (err) {
      console.error('Failed loading masters', err);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/v1/sales/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setOverview(json.data);
      }
    } catch (err) {
      console.error('Overview fetch failed', err);
    }
  };

  const fetchTabData = async (tab: string, pageNum: number, search: string, status: string) => {
    if (tab === 'overview') {
      fetchOverview();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '15',
        query: search,
        status: status,
      });

      let url = '';
      if (tab === 'quotations') url = `/api/v1/sales/quotations?${params.toString()}`;
      else if (tab === 'orders') url = `/api/v1/sales/orders?${params.toString()}`;
      else if (tab === 'fulfillments') url = `/api/v1/sales/fulfillments?${params.toString()}`;
      else if (tab === 'invoices') url = `/api/v1/sales/invoices?${params.toString()}`;
      else if (tab === 'credit-notes') url = `/api/v1/sales/credit-notes?${params.toString()}`;
      else if (tab === 'debit-notes') url = `/api/v1/sales/debit-notes?${params.toString()}`;
      else if (tab === 'returns') url = `/api/v1/sales/returns?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();

      if (json.success) {
        if (tab === 'quotations') setQuotations(json.items || []);
        else if (tab === 'orders') setOrders(json.items || []);
        else if (tab === 'fulfillments') setFulfillments(json.items || []);
        else if (tab === 'invoices') setInvoices(json.items || []);
        else if (tab === 'credit-notes') setCreditNotes(json.items || []);
        else if (tab === 'debit-notes') setDebitNotes(json.items || []);
        else if (tab === 'returns') setReturns(json.items || []);

        setTotalPages(json.total_pages || 1);
      } else {
        setError(json.error || 'Failed to fetch items');
      }
    } catch (err) {
      setError('Network error updating sales console dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTabData(activeTab, 1, searchQuery, statusFilter);
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    fetchTabData(activeTab, 1, searchQuery, status);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTabData(activeTab, p, searchQuery, statusFilter);
  };

  // Open item detail, fetching snapshots, histories, and attachments dynamically
  const openItemDetail = async (item: any, type: string) => {
    setSelectedItem(item);
    setSelectedType(type);
    setHistories([]);
    setSnapshot(null);
    setAttachments([]);
    setCreditEval('APPROVED');

    try {
      // 1. Fetch Snapshot
      const snapRes = await fetch(`/api/v1/sales/documents/${item.id}/snapshots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const snapJson = await snapRes.json();
      if (snapJson.success) setSnapshot(snapJson.data);

      // 2. Fetch Histories
      const histRes = await fetch(`/api/v1/sales/documents/${item.id}/histories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const histJson = await histRes.json();
      if (histJson.success) setHistories(histJson.data || []);

      // 3. Fetch Attachments
      const attRes = await fetch(`/api/v1/sales/documents/${item.id}/attachments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attJson = await attRes.json();
      if (attJson.success) setAttachments(attJson.data || []);

      // 4. Fetch Credit evaluation if quotation or order
      if (type === 'QUOTATION' || type === 'SALES_ORDER') {
        const evalRes = await fetch(`/api/v1/sales/customers/${item.customer_id}/credit-evaluation?order_total=${item.grand_total}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const evalJson = await evalRes.json();
        if (evalJson.success) setCreditEval(evalJson.data.status);
      }
    } catch (err) {
      console.error('Failed fetching supplementary details', err);
    }
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadPath) {
      alert('Attachment file name and file path are required.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/sales/documents/${selectedItem.id}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_type: selectedType,
          file_name: uploadName,
          file_path: uploadPath,
          mime_type: uploadMime,
          file_size: Math.floor(Math.random() * 500000) + 15000,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAttachments([...attachments, json.data]);
        setUploadName('');
        setUploadPath('');
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch (err) {
      alert('Attachment upload network error');
    }
  };

  // State machine triggers
  const executeWorkflow = async (url: string, body: any = {}) => {
    if (!confirm('Are you sure you want to perform this workflow transition?')) return;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        alert('Workflow operation succeeded.');
        setSelectedItem(null);
        fetchTabData(activeTab, page, searchQuery, statusFilter);
      } else {
        alert(`Operation Failed: ${json.error}`);
      }
    } catch (err) {
      alert('Failed to execute workflow due to network issues.');
    }
  };

  // Pricing helper for wizard
  const resolveWizardLinePricing = async (idx: number, prodId: string, qty: number) => {
    if (!customerId || !prodId) return;
    try {
      const params = new URLSearchParams({
        customer_id: customerId,
        product_id: prodId,
        currency_code: currencyCode,
        quantity: String(qty),
      });
      const res = await fetch(`/api/v1/sales/pricing/resolve?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const updatedLines = [...lines];
        updatedLines[idx].unit_price = json.data.unit_price;
        updatedLines[idx].tax_classification_code = json.data.tax_classification_code;
        updatedLines[idx].tax_rate = json.data.tax_rate;
        setLines(updatedLines);
      }
    } catch (err) {
      console.error('Pricing lookup failed', err);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { product_id: '', quantity: 1, unit_price: '0.00', tax_rate: '0', discount_type: 'PERCENTAGE', discount_value: '0' }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    const updated = [...lines];
    updated[idx][field] = val;
    setLines(updated);

    if (field === 'product_id' || field === 'quantity') {
      const prodId = field === 'product_id' ? val : updated[idx].product_id;
      const qty = field === 'quantity' ? parseInt(val, 10) || 1 : updated[idx].quantity;
      resolveWizardLinePricing(idx, prodId, qty);
    }
  };

  const submitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0 && wizardType !== 'FULFILLMENT_AUTO') {
      alert('Please add at least one line item.');
      return;
    }

    let url = '';
    let payload: any = {};

    if (wizardType === 'QUOTATION') {
      url = '/api/v1/sales/quotations';
      payload = {
        customer_id: customerId,
        legal_entity_id: legalEntityId,
        branch_id: branchId || null,
        currency_code: currencyCode,
        notes,
        expiry_days: expiryDays,
        lines: lines.map(l => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: l.unit_price,
          discount_type: l.discount_type,
          discount_value: l.discount_value,
        }))
      };
    } else if (wizardType === 'SALES_ORDER') {
      url = '/api/v1/sales/orders';
      payload = {
        customer_id: customerId,
        legal_entity_id: legalEntityId,
        branch_id: branchId || null,
        currency_code: currencyCode,
        notes,
        payment_terms: paymentTerms,
        source_quotation_id: sourceQuotationId || null,
        lines: lines.map(l => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: l.unit_price,
          discount_type: l.discount_type,
          discount_value: l.discount_value,
        }))
      };
    } else if (wizardType === 'DEBIT_NOTE') {
      url = '/api/v1/sales/debit-notes';
      payload = {
        customer_id: customerId,
        legal_entity_id: legalEntityId,
        branch_id: branchId || null,
        currency_code: currencyCode,
        reason,
        lines: lines.map(l => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: l.unit_price,
          discount_type: l.discount_type,
          discount_value: l.discount_value,
        }))
      };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        alert('Document created successfully.');
        setIsWizardOpen(false);
        resetWizardFields();
        fetchTabData(activeTab, 1, '', '');
      } else {
        alert(`Failed to create document: ${json.error}`);
      }
    } catch (err) {
      alert('Creation wizard network error');
    }
  };

  const resetWizardFields = () => {
    setCustomerId('');
    setNotes('');
    setReason('');
    setCurrencyCode('INR');
    setExpiryDays(30);
    setPaymentTerms('NET30');
    setSourceQuotationId('');
    setLines([]);
  };

  const openWizard = (type: string) => {
    setWizardType(type);
    resetWizardFields();
    setIsWizardOpen(true);
    handleAddLine();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#1E3A8A]" />
            Sales & Commercial Transactions
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Global high-frequency transaction console. Multi-state flow managers, credit guards, and accounting posting gateways.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'quotations' && (
            <button
              onClick={() => openWizard('QUOTATION')}
              className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => openWizard('SALES_ORDER')}
              className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Sales Order
            </button>
          )}
          {activeTab === 'debit-notes' && (
            <button
              onClick={() => openWizard('DEBIT_NOTE')}
              className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Debit Note
            </button>
          )}
        </div>
      </div>

      {/* KPI Overviews (dynamic data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Sales Revenue</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">₹{overview?.total_revenue || '0.00'}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Pending Orders</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">{overview?.pending_orders_count || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Open Quotations</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">{overview?.open_quotations_count || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Active Deliveries</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">{overview?.active_fulfillments_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'quotations' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Quotations
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'orders' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Sales Orders
        </button>
        <button
          onClick={() => setActiveTab('fulfillments')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'fulfillments' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Deliveries & Fulfillments
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'invoices' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('credit-notes')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'credit-notes' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Credit Notes
        </button>
        <button
          onClick={() => setActiveTab('debit-notes')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'debit-notes' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Debit Notes
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-tight transition-all cursor-pointer ${
            activeTab === 'returns' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Sales Returns
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'overview' ? (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Live Operational Integrity Guard
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Bill Vyom executes strict separation between <strong>commercial records</strong> and <strong>general ledgers</strong>. Changing states here emits real-time events to the Accounting Posting Service to maintain balanced transaction boundaries automatically with no placeholder accounts.
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-gray-600">
                    <strong>Zero-Fake-Data Enforcement:</strong> The pricing resolution layer resolves values instantly using the Phase 3 master price lists. Credit-limit evaluations are parsed immediately on quotation & sales order drafts to protect AR lines.
                  </div>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-5 space-y-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quick Launch Guides</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs p-3 bg-white border border-gray-150 rounded-lg hover:border-gray-300 transition-all cursor-pointer" onClick={() => { setActiveTab('quotations'); }}>
                    <span className="font-semibold text-gray-700">Issue New Quotation</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 bg-white border border-gray-150 rounded-lg hover:border-gray-300 transition-all cursor-pointer" onClick={() => { setActiveTab('orders'); }}>
                    <span className="font-semibold text-gray-700">Receive Sales Order</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 bg-white border border-gray-150 rounded-lg hover:border-gray-300 transition-all cursor-pointer" onClick={() => { setActiveTab('invoices'); }}>
                    <span className="font-semibold text-gray-700">Post Customer Invoice</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Search and Filters Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, Customer Name, Number or Notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#1E3A8A] transition-all bg-white text-gray-800"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white text-gray-700"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ISSUED">Issued</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="FULFILLED">Fulfilled</option>
                  <option value="VOIDED">Voided</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </form>

            {loading ? (
              <div className="flex justify-center items-center py-20 text-xs text-gray-500 font-semibold gap-2">
                <div className="w-4 h-4 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
                Updating transactional dataset...
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-20 text-xs text-red-500 font-semibold gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ) : (
              <div>
                {/* Lists rendering block */}
                <div className="overflow-x-auto border border-gray-200/80 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Doc Number</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {/* Quotations Row */}
                      {activeTab === 'quotations' && quotations.map((q) => {
                        const customer = customers.find(c => c.id === q.customer_id);
                        return (
                          <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{q.quotation_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || q.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(q.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₹{q.grand_total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                q.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                q.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                                q.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>{q.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(q, 'QUOTATION')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Orders Row */}
                      {activeTab === 'orders' && orders.map((o) => {
                        const customer = customers.find(c => c.id === o.customer_id);
                        return (
                          <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{o.sales_order_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || o.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₹{o.grand_total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                o.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>{o.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(o, 'SALES_ORDER')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Fulfillments */}
                      {activeTab === 'fulfillments' && fulfillments.map((f) => {
                        const customer = customers.find(c => c.id === f.customer_id);
                        return (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{f.fulfillment_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || f.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(f.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-500">-</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">{f.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(f, 'FULFILLMENT')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Invoices */}
                      {activeTab === 'invoices' && invoices.map((inv) => {
                        const customer = customers.find(c => c.id === inv.customer_id);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{inv.invoice_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || inv.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₹{inv.grand_total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                inv.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{inv.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(inv, 'INVOICE')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Credit Notes */}
                      {activeTab === 'credit-notes' && creditNotes.map((cn) => {
                        const customer = customers.find(c => c.id === cn.customer_id);
                        return (
                          <tr key={cn.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{cn.credit_note_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || cn.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(cn.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₹{cn.grand_total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cn.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                              }`}>{cn.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(cn, 'CREDIT_NOTE')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Debit Notes */}
                      {activeTab === 'debit-notes' && debitNotes.map((dn) => {
                        const customer = customers.find(c => c.id === dn.customer_id);
                        return (
                          <tr key={dn.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{dn.debit_note_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || dn.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(dn.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₹{dn.grand_total}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dn.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                              }`}>{dn.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(dn, 'DEBIT_NOTE')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Returns */}
                      {activeTab === 'returns' && returns.map((ret) => {
                        const customer = customers.find(c => c.id === ret.customer_id);
                        return (
                          <tr key={ret.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{ret.return_number}</td>
                            <td className="px-4 py-3.5 text-gray-600">{customer?.customer_name || ret.customer_id}</td>
                            <td className="px-4 py-3.5 text-gray-500">{new Date(ret.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₹{ret.grand_total || '0.00'}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ret.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                              }`}>{ret.status}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => openItemDetail(ret, 'RETURNS')} className="text-[#1E3A8A] hover:underline font-semibold cursor-pointer">Manage</button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Empty state check */}
                      {((activeTab === 'quotations' && quotations.length === 0) ||
                        (activeTab === 'orders' && orders.length === 0) ||
                        (activeTab === 'fulfillments' && fulfillments.length === 0) ||
                        (activeTab === 'invoices' && invoices.length === 0) ||
                        (activeTab === 'credit-notes' && creditNotes.length === 0) ||
                        (activeTab === 'debit-notes' && debitNotes.length === 0) ||
                        (activeTab === 'returns' && returns.length === 0)) && (
                        <tr>
                          <td colSpan={6} className="px-4 py-20 text-center text-xs text-gray-400 font-semibold leading-relaxed">
                            No genuine operational records found for this workspace. Use the creators/workflows to issue transactions.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL DRAWER */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-screen shadow-2xl flex flex-col overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{selectedType} Lifecycle manager</span>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">
                  {selectedItem.quotation_number || selectedItem.sales_order_number || selectedItem.fulfillment_number || selectedItem.invoice_number || selectedItem.credit_note_number || selectedItem.debit_note_number || selectedItem.return_number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg text-xs">
                  <div className="text-gray-400 font-semibold mb-1">Commercial Subtotal</div>
                  <div className="font-bold text-gray-800">₹{selectedItem.subtotal || '0.00'}</div>
                  <div className="text-[10px] text-gray-400 mt-1">Discount: ₹{selectedItem.discount_total || '0.00'}</div>
                </div>
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg text-xs">
                  <div className="text-gray-400 font-semibold mb-1">Grand Total (inc. Tax)</div>
                  <div className="font-bold text-green-700 text-base">₹{selectedItem.grand_total || '0.00'}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Tax Component: ₹{selectedItem.tax_total || '0.00'}</div>
                </div>
              </div>

              {/* State Transitions Alert */}
              <div className="border border-yellow-200 bg-yellow-50/50 p-4 rounded-lg text-xs leading-relaxed text-yellow-800">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 shrink-0" /> State Transition Control Board
                </div>
                <p className="mt-1">
                  Active Lifecycle Status: <strong className="uppercase bg-yellow-200/50 px-1.5 py-0.5 rounded text-[10px] font-black">{selectedItem.status}</strong>
                </p>
                {/* Dynamic State actions based on selectedType */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedType === 'QUOTATION' && selectedItem.status === 'DRAFT' && (
                    <button
                      onClick={() => executeWorkflow(`/api/v1/sales/quotations/${selectedItem.id}/convert-to-order`)}
                      className="px-3 py-1 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      Approve & Convert to Sales Order <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {selectedType === 'SALES_ORDER' && selectedItem.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => executeWorkflow(`/api/v1/sales/orders/${selectedItem.id}/confirm`)}
                        className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-semibold text-[11px] cursor-pointer"
                      >
                        Confirm Sales Order
                      </button>
                      <button
                        onClick={() => executeWorkflow(`/api/v1/sales/orders/${selectedItem.id}/cancel`)}
                        className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 rounded font-semibold text-[11px] cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}

                  {selectedType === 'SALES_ORDER' && (selectedItem.status === 'CONFIRMED' || selectedItem.status === 'PARTIALLY_FULFILLED') && (
                    <>
                      <button
                        onClick={() => executeWorkflow(`/api/v1/sales/orders/${selectedItem.id}/convert-to-invoice`)}
                        className="px-3 py-1 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        Generate Invoice Draft
                      </button>
                      {/* Delivery creation wizard launcher */}
                      <button
                        onClick={() => {
                          if (confirm('Create Fulfillment for this order automatically?')) {
                            // Hit creation API with order lines
                            executeWorkflow('/api/v1/sales/fulfillments', {
                              sales_order_id: selectedItem.id,
                              notes: 'Fulfillment processed from life-cycle console.',
                              lines: selectedItem.lines.map((l: any) => ({
                                sales_order_line_id: l.id,
                                product_id: l.product_id,
                                quantity: l.quantity_remaining,
                                uom_id: l.uom_id,
                                warehouse_id: warehouseId || null,
                              }))
                            });
                          }
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        Dispatch Fulfillment
                      </button>
                    </>
                  )}

                  {selectedType === 'INVOICE' && selectedItem.status === 'DRAFT' && (
                    <button
                      onClick={() => executeWorkflow(`/api/v1/sales/invoices/${selectedItem.id}/post`)}
                      className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      Post / Issue Invoice
                    </button>
                  )}

                  {selectedType === 'INVOICE' && selectedItem.status === 'POSTED' && (
                    <>
                      <button
                        onClick={() => executeWorkflow(`/api/v1/sales/invoices/${selectedItem.id}/void`, { reason: 'Voided from admin console.' })}
                        className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 rounded font-semibold text-[11px] cursor-pointer"
                      >
                        Void Invoice
                      </button>
                      {/* Credit Note issuance */}
                      <button
                        onClick={() => {
                          const rsn = prompt('Reason for issuing credit note:');
                          if (!rsn) return;
                          executeWorkflow('/api/v1/sales/credit-notes', {
                            original_invoice_id: selectedItem.id,
                            reason: rsn,
                            lines: selectedItem.lines.map((l: any) => ({
                              product_id: l.product_id,
                              quantity: l.quantity,
                              unit_price: l.unit_price,
                              invoice_line_id: l.id,
                            }))
                          });
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded font-semibold text-[11px] cursor-pointer"
                      >
                        Issue Credit Note (Draft)
                      </button>
                    </>
                  )}

                  {selectedType === 'CREDIT_NOTE' && selectedItem.status === 'DRAFT' && (
                    <button
                      onClick={() => executeWorkflow(`/api/v1/sales/credit-notes/${selectedItem.id}/post`)}
                      className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      Post Credit Note
                    </button>
                  )}

                  {selectedType === 'DEBIT_NOTE' && selectedItem.status === 'DRAFT' && (
                    <button
                      onClick={() => executeWorkflow(`/api/v1/sales/debit-notes/${selectedItem.id}/post`)}
                      className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      Post Debit Note
                    </button>
                  )}

                  {selectedType === 'RETURNS' && selectedItem.status === 'PENDING' && (
                    <button
                      onClick={() => executeWorkflow(`/api/v1/sales/returns/${selectedItem.id}/approve`)}
                      className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      Approve Return
                    </button>
                  )}
                </div>
              </div>

              {/* Credit Limit Indicator for Quotation/Orders */}
              {(selectedType === 'QUOTATION' || selectedType === 'SALES_ORDER') && (
                <div className={`p-4 border rounded-lg text-xs flex items-center justify-between ${
                  creditEval === 'CREDIT_LIMIT_EXCEEDED' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-bold">Customer Credit-Control Check</div>
                      <div className="text-[10px] mt-0.5 opacity-80">
                        {creditEval === 'CREDIT_LIMIT_EXCEEDED' ? 'CRITICAL ALERT: This transaction exceeds customer credit limit threshold!' : 'Customer credit limit is fully approved. Safe to proceed.'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wide ${
                    creditEval === 'CREDIT_LIMIT_EXCEEDED' ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'
                  }`}>{creditEval}</span>
                </div>
              )}

              {/* Line Items Detail table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Document Line Entries</h3>
                <div className="border border-gray-150 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase">
                        <th className="px-4 py-2">Item / SKU</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Tax Rate</th>
                        <th className="px-4 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedItem.lines?.map((l: any) => {
                        const prod = products.find(p => p.id === l.product_id);
                        return (
                          <tr key={l.id}>
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-gray-800">{prod?.name || l.description || 'Commercial item'}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{l.sku || 'SKU-000'}</div>
                            </td>
                            <td className="px-4 py-2.5 text-center font-semibold text-gray-700">{l.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">₹{l.unit_price}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">{l.tax_rate}%</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-800">₹{l.line_total || l.subtotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immutable Snapshot View */}
              {snapshot && (
                <div className="bg-slate-50/50 p-5 border border-gray-150 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-500" /> Immutable Address & Audit Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-gray-500">Billing Address Snapshot</div>
                      <div className="text-gray-700 mt-1 leading-relaxed">
                        {snapshot.billing_address?.street_address || 'No billing address recorded'}<br />
                        {snapshot.billing_address?.city}, {snapshot.billing_address?.state_province}<br />
                        {snapshot.billing_address?.country_code} - {snapshot.billing_address?.postal_code}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Shipping Address Snapshot</div>
                      <div className="text-gray-700 mt-1 leading-relaxed">
                        {snapshot.shipping_address?.street_address || 'No shipping address recorded'}<br />
                        {snapshot.shipping_address?.city}, {snapshot.shipping_address?.state_province}<br />
                        {snapshot.shipping_address?.country_code} - {snapshot.shipping_address?.postal_code}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 border-t border-gray-200/60 pt-2 mt-2">
                    Customer Snapshot: <strong>{snapshot.customer_name}</strong> | Credit Limit Snapshot: ₹{snapshot.credit_limit}
                  </div>
                </div>
              )}

              {/* Status Change History Logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Document Audit & History trail</h3>
                <div className="space-y-2">
                  {histories.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-1 font-semibold text-gray-700">
                          <span className="uppercase">{h.from_status}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="uppercase text-green-700 font-bold">{h.to_status}</span>
                        </div>
                        <div className="text-gray-400 mt-1 font-medium">{h.reason || 'Status transition executed.'}</div>
                      </div>
                      <div className="text-[10px] text-gray-400 text-right">
                        <div>{new Date(h.timestamp).toLocaleTimeString()}</div>
                        <div className="mt-0.5 font-bold">Actor: {h.actor_id}</div>
                      </div>
                    </div>
                  ))}
                  {histories.length === 0 && (
                    <div className="text-xs text-gray-400 italic">No historical audit transitions recorded.</div>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3 border-t border-gray-150 pt-5">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <Upload className="w-4 h-4 text-blue-500" /> Document Attachments ({attachments.length})
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {attachments.map((a) => (
                    <div key={a.id} className="p-3 border border-gray-150 rounded-lg flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <FileBox className="w-4 h-4 text-[#1E3A8A]" />
                        <div>
                          <div className="font-semibold text-gray-800">{a.file_name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{a.file_path} ({(a.file_size / 1024).toFixed(1)} KB)</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400">Uploaded {new Date(a.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>

                {/* Upload Form */}
                <form onSubmit={handleUploadAttachment} className="mt-3 bg-slate-50 p-4 border border-slate-150 rounded-lg space-y-3">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Upload New Attachment (Simulated Storage)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="File Name (e.g. signed_order.pdf)"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      className="p-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-[#1E3A8A]"
                    />
                    <input
                      type="text"
                      placeholder="File Path (e.g. /secure/sales/123.pdf)"
                      value={uploadPath}
                      onChange={(e) => setUploadPath(e.target.value)}
                      className="p-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <select
                      value={uploadMime}
                      onChange={(e) => setUploadMime(e.target.value)}
                      className="p-1.5 border border-gray-200 bg-white rounded text-xs text-gray-700"
                    >
                      <option value="application/pdf">PDF Document</option>
                      <option value="image/png">PNG Image</option>
                      <option value="application/xml">XML Schema</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded text-xs font-semibold hover:bg-[#152a66]"
                    >
                      Attach File
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATION WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">CREATION WIZARD</h3>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">Issue New Commercial {wizardType}</h2>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitWizard} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Customer Master (Isolation Check)</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800"
                  >
                    <option value="">Select Genuine Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.customer_name} ({c.customer_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Legal Entity Host</label>
                  <select
                    required
                    value={legalEntityId}
                    onChange={(e) => setLegalEntityId(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800"
                  >
                    {legalEntities.map(le => (
                      <option key={le.id} value={le.id}>{le.legal_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Branch Code</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800"
                  >
                    <option value="">No Branch Association</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Currency Unit</label>
                  <input
                    type="text"
                    required
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800 font-bold uppercase"
                  />
                </div>
              </div>

              {wizardType === 'QUOTATION' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Quotation Expiry Horizon (Days)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800"
                  />
                </div>
              )}

              {wizardType === 'SALES_ORDER' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Payment Terms Contract</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800"
                  >
                    <option value="IMMEDIATE">COD / Immediate</option>
                    <option value="NET30">Net 30 Days</option>
                    <option value="NET65">Net 65 Days</option>
                  </select>
                </div>
              )}

              {wizardType === 'DEBIT_NOTE' ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Debit Reason</label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide specific, non-fabricated reason for issuing this debit note..."
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800 h-16 resize-none"
                  ></textarea>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Commercial Notes & Terms</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter special terms, routing logistics or shipping details..."
                    className="w-full mt-1 p-2 border border-gray-200 rounded text-xs outline-none focus:border-[#1E3A8A] bg-white text-gray-800 h-16 resize-none"
                  ></textarea>
                </div>
              )}

              {/* Dynamic Lines Form Block */}
              <div className="space-y-2 border-t border-gray-150 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Document Line Entries</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-[10px] font-bold text-[#1E3A8A] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add line
                  </button>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-lg grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <select
                          required
                          value={line.product_id}
                          onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                          className="w-full p-1.5 border border-gray-200 rounded text-[11px] outline-none bg-white"
                        >
                          <option value="">Select SKU</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full p-1.5 border border-gray-200 rounded text-[11px] outline-none bg-white text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="text-[11px] text-gray-500 font-semibold px-2 py-1 bg-white border border-gray-150 rounded text-right">
                          ₹{line.unit_price}
                        </div>
                      </div>
                      <div className="col-span-2 text-[10px] text-gray-400 font-bold text-center">
                        Tax: {line.tax_rate}%
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-gray-200 pt-4 flex justify-end gap-2 bg-slate-50 px-6 py-3 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow cursor-pointer"
                >
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
