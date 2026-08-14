import React, { useState, useEffect } from 'react';
import {
  Store,
  MonitorSmartphone,
  CreditCard,
  Receipt,
  RotateCcw,
  Scale,
  WifiOff,
  History,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Box,
  ShoppingCart,
  Trash2,
  PauseCircle,
  PlayCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Percent,
  X,
  FileText,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Check
} from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

export default function POSPage() {
  const { token, activeTenant, activeLegalEntity, activeBranch, activeWarehouse } = useTenant();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    | 'register'
    | 'sessions'
    | 'terminals'
    | 'held'
    | 'transactions'
    | 'returns'
    | 'reconciliation'
    | 'offline'
  >('register');

  // Loading & data states
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<any | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [cart, setCart] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [cashMovements, setCashMovements] = useState<any[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<any[]>([]);
  const [offlineDevices, setOfflineDevices] = useState<any[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<any[]>([]);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [txSearch, setTxSearch] = useState('');

  // Modals
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);

  // Form states
  const [openingFloat, setOpeningFloat] = useState('500.00');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingCountedCash, setClosingCountedCash] = useState('0.00');
  const [closingNotes, setClosingNotes] = useState('');
  const [cashMovementType, setCashMovementType] = useState<'PAID_IN' | 'PAID_OUT' | 'ADJUSTMENT'>('PAID_IN');
  const [cashMovementAmount, setCashMovementAmount] = useState('100.00');
  const [cashMovementReason, setCashMovementReason] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [holdRef, setHoldRef] = useState('');

  // Payment Form States
  const [selectedCustomer, setSelectedCustomer] = useState<string>('cust_walk_in');
  const [paymentLines, setPaymentLines] = useState<{ payment_method: string; amount: string; tendered_amount: string; reference_number: string }[]>([
    { payment_method: 'CASH', amount: '0.00', tendered_amount: '0.00', reference_number: '' }
  ]);

  // Terminal Form State
  const [newTerminalCode, setNewTerminalCode] = useState('POS-01');
  const [newTerminalName, setNewTerminalName] = useState('Main Checkout Counter');
  const [newPrinterType, setNewPrinterType] = useState<'THERMAL' | 'A4'>('THERMAL');

  // Return Form State
  const [returnTxId, setReturnTxId] = useState('');
  const [returnSelectedTx, setReturnSelectedTx] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState('Defective item');
  const [returnCondition, setReturnCondition] = useState<'RESELLABLE' | 'DAMAGED' | 'DEFECTIVE' | 'QUARANTINE'>('DAMAGED');
  const [returnTargetStatus, setReturnTargetStatus] = useState<'AVAILABLE' | 'DAMAGED' | 'QUARANTINED'>('DAMAGED');
  const [returnMethod, setReturnMethod] = useState('CASH');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  // Message notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper fetch with auth
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    return res.json();
  };

  // Load all initial data
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [
        dashRes,
        termsRes,
        prodsRes,
        custsRes,
        txRes,
        retRes,
        heldRes,
        recRes,
        offDevRes,
        offConfRes,
      ] = await Promise.all([
        apiFetch('/api/v1/pos/dashboard'),
        apiFetch('/api/v1/pos/terminals'),
        apiFetch('/api/v1/master/products'),
        apiFetch('/api/v1/master/customers'),
        apiFetch('/api/v1/pos/transactions'),
        apiFetch('/api/v1/pos/returns'),
        apiFetch('/api/v1/pos/held-sales'),
        apiFetch('/api/v1/pos/reconciliation'),
        apiFetch('/api/v1/pos/offline/devices'),
        apiFetch('/api/v1/pos/offline/conflicts'),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (termsRes.success) {
        setTerminals(termsRes.data);
        if (termsRes.data.length > 0 && !selectedTerminal) {
          setSelectedTerminal(termsRes.data[0]);
          fetchActiveSession(termsRes.data[0].id);
        }
      }
      if (prodsRes.success) setProducts(prodsRes.data?.items || prodsRes.data || []);
      if (custsRes.success) setCustomers(custsRes.data?.items || custsRes.data || []);
      if (txRes.success) setTransactions(txRes.data);
      if (retRes.success) setReturns(retRes.data);
      if (heldRes.success) setHeldSales(heldRes.data);
      if (recRes.success) setReconciliationRuns(recRes.data);
      if (offDevRes.success) setOfflineDevices(offDevRes.data);
      if (offConfRes.success) setSyncConflicts(offConfRes.data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSession = async (terminalId: string) => {
    try {
      const res = await apiFetch(`/api/v1/pos/sessions/active?terminal_id=${terminalId}`);
      if (res.success && res.data) {
        setActiveSession(res.data);
        fetchCart(res.data.id);
        fetchCashMovements(res.data.id);
      } else {
        setActiveSession(null);
        setCart(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCart = async (sessionId: string) => {
    try {
      const res = await apiFetch(`/api/v1/pos/cart?session_id=${sessionId}`);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCashMovements = async (sessionId: string) => {
    try {
      const res = await apiFetch(`/api/v1/pos/sessions/${sessionId}/cash-movements`);
      if (res.success) setCashMovements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await apiFetch('/api/v1/pos/sessions');
      if (res.success) setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  // ==========================================
  // REGISTER / CART HANDLERS
  // ==========================================

  const handleAddToCart = async (product: any) => {
    if (!activeSession) {
      showToast('error', 'Please open a POS shift session first.');
      return;
    }
    if (!cart) return;

    try {
      const res = await apiFetch('/api/v1/pos/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          cart_id: cart.id,
          product_id: product.id,
          quantity: 1,
        }),
      });

      if (res.success) {
        setCart(res.data);
        showToast('success', `Added ${product.name} to cart.`);
      } else {
        showToast('error', res.error || 'Failed to add item to cart.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleUpdateCartQty = async (itemId: string, currentQty: number, delta: number) => {
    if (!cart) return;
    const newQty = currentQty + delta;
    try {
      if (newQty <= 0) {
        const res = await apiFetch(`/api/v1/pos/cart/items/${itemId}?cart_id=${cart.id}`, {
          method: 'DELETE',
        });
        if (res.success) setCart(res.data);
      } else {
        const res = await apiFetch(`/api/v1/pos/cart/items/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({
            cart_id: cart.id,
            quantity: newQty,
          }),
        });
        if (res.success) setCart(res.data);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleClearCart = async () => {
    if (!cart) return;
    try {
      const res = await apiFetch('/api/v1/pos/cart/clear', {
        method: 'POST',
        body: JSON.stringify({ cart_id: cart.id }),
      });
      if (res.success) {
        setCart(res.data);
        showToast('success', 'Cart cleared.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleHoldSale = async () => {
    if (!cart || cart.items.length === 0) return;
    try {
      const res = await apiFetch('/api/v1/pos/cart/hold', {
        method: 'POST',
        body: JSON.stringify({
          cart_id: cart.id,
          reason: holdReason,
          reference: holdRef,
        }),
      });
      if (res.success) {
        showToast('success', 'Sale successfully put on hold.');
        setShowHoldModal(false);
        setHoldReason('');
        setHoldRef('');
        fetchActiveSession(selectedTerminal.id);
        const heldRes = await apiFetch('/api/v1/pos/held-sales');
        if (heldRes.success) setHeldSales(heldRes.data);
      } else {
        showToast('error', res.error || 'Failed to hold sale.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleResumeHeldSale = async (heldCartId: string) => {
    try {
      const res = await apiFetch(`/api/v1/pos/held-sales/${heldCartId}/resume`, {
        method: 'POST',
      });
      if (res.success) {
        setCart(res.data);
        showToast('success', 'Held sale resumed into active register.');
        setActiveTab('register');
        const heldRes = await apiFetch('/api/v1/pos/held-sales');
        if (heldRes.success) setHeldSales(heldRes.data);
      } else {
        showToast('error', res.error || 'Failed to resume held sale.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCancelHeldSale = async (heldCartId: string) => {
    try {
      const res = await apiFetch(`/api/v1/pos/held-sales/${heldCartId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('success', 'Held sale cancelled.');
        const heldRes = await apiFetch('/api/v1/pos/held-sales');
        if (heldRes.success) setHeldSales(heldRes.data);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Open Payment Modal
  const openPayment = () => {
    if (!cart || cart.items.length === 0) {
      showToast('error', 'Cart is empty.');
      return;
    }
    setPaymentLines([
      {
        payment_method: 'CASH',
        amount: cart.grand_total,
        tendered_amount: cart.grand_total,
        reference_number: '',
      },
    ]);
    setShowPaymentModal(true);
  };

  const handleCheckoutSubmit = async () => {
    if (!cart) return;
    try {
      const res = await apiFetch('/api/v1/pos/checkout', {
        method: 'POST',
        body: JSON.stringify({
          cart_id: cart.id,
          customer_id: selectedCustomer !== 'cust_walk_in' ? selectedCustomer : null,
          payments: paymentLines.map((p) => ({
            payment_method: p.payment_method,
            amount: p.amount,
            tendered_amount: p.tendered_amount,
            reference_number: p.reference_number || undefined,
          })),
        }),
      });

      if (res.success) {
        showToast('success', `Checkout complete! Transaction #${res.data.transaction.transaction_number}`);
        setShowPaymentModal(false);
        setActiveReceipt(res.data.receipt);
        setShowReceiptModal(true);
        loadData();
        if (selectedTerminal) fetchActiveSession(selectedTerminal.id);
      } else {
        showToast('error', res.error || 'Checkout failed.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // ==========================================
  // SESSION HANDLERS
  // ==========================================

  const handleOpenSession = async () => {
    if (!selectedTerminal) return;
    try {
      const res = await apiFetch('/api/v1/pos/sessions/open', {
        method: 'POST',
        body: JSON.stringify({
          legal_entity_id: activeLegalEntity?.id || 'le_default',
          branch_id: selectedTerminal.branch_id,
          warehouse_id: selectedTerminal.warehouse_id,
          terminal_id: selectedTerminal.id,
          opening_float: openingFloat,
          opening_notes: openingNotes,
        }),
      });

      if (res.success) {
        showToast('success', `Shift session opened with float ₹${openingFloat}`);
        setShowOpenSessionModal(false);
        setActiveSession(res.data);
        fetchCart(res.data.id);
        fetchCashMovements(res.data.id);
        loadData();
      } else {
        showToast('error', res.error || 'Failed to open session.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      const res = await apiFetch(`/api/v1/pos/sessions/${activeSession.id}/close`, {
        method: 'POST',
        body: JSON.stringify({
          counted_cash: closingCountedCash,
          closing_notes: closingNotes,
        }),
      });

      if (res.success) {
        showToast('success', `Session closed. Variance: ₹${res.data.cash_variance}`);
        setShowCloseSessionModal(false);
        setActiveSession(null);
        setCart(null);
        loadData();
      } else {
        showToast('error', res.error || 'Failed to close session.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCashMovementSubmit = async () => {
    if (!activeSession) return;
    try {
      const res = await apiFetch(`/api/v1/pos/sessions/${activeSession.id}/cash-movements`, {
        method: 'POST',
        body: JSON.stringify({
          movement_type: cashMovementType,
          amount: cashMovementAmount,
          reason: cashMovementReason,
        }),
      });

      if (res.success) {
        showToast('success', `Cash ${cashMovementType} recorded: ₹${cashMovementAmount}`);
        setShowCashMovementModal(false);
        setCashMovementReason('');
        fetchCashMovements(activeSession.id);
        fetchActiveSession(selectedTerminal.id);
      } else {
        showToast('error', res.error || 'Failed to record cash movement.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // ==========================================
  // TERMINAL HANDLER
  // ==========================================

  const handleCreateTerminal = async () => {
    try {
      const res = await apiFetch('/api/v1/pos/terminals', {
        method: 'POST',
        body: JSON.stringify({
          legal_entity_id: activeLegalEntity?.id || 'le_default',
          branch_id: activeBranch?.id || 'br_default',
          warehouse_id: activeWarehouse?.id || 'wh_default',
          terminal_code: newTerminalCode,
          terminal_name: newTerminalName,
          hardware_config: {
            receipt_printer_enabled: true,
            receipt_printer_type: newPrinterType,
            barcode_scanner_enabled: true,
          },
        }),
      });

      if (res.success) {
        showToast('success', `POS Terminal ${newTerminalCode} created successfully.`);
        setShowTerminalModal(false);
        loadData();
      } else {
        showToast('error', res.error || 'Failed to create terminal.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // ==========================================
  // RETURN HANDLERS
  // ==========================================

  const handleSelectReturnTx = (tx: any) => {
    setReturnSelectedTx(tx);
    const initialQtys: Record<string, number> = {};
    for (const line of tx.lines) {
      initialQtys[line.id] = 1;
    }
    setReturnQuantities(initialQtys);
  };

  const handleProcessReturn = async () => {
    if (!returnSelectedTx) return;
    const linesToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([lineId, qty]) => ({
        original_line_id: lineId,
        quantity_returned: Number(qty),
        condition: returnCondition,
      }));

    if (linesToReturn.length === 0) {
      showToast('error', 'Select at least one item quantity to return.');
      return;
    }

    try {
      const res = await apiFetch('/api/v1/pos/returns', {
        method: 'POST',
        body: JSON.stringify({
          original_transaction_id: returnSelectedTx.id,
          return_reason: returnReason,
          condition: returnCondition,
          target_inventory_status: returnTargetStatus,
          refund_method: returnMethod,
          lines: linesToReturn,
        }),
      });

      if (res.success) {
        showToast('success', `Return #${res.data.return_number} processed! Refund: ₹${res.data.refund_total}`);
        setShowReturnModal(false);
        setReturnSelectedTx(null);
        loadData();
      } else {
        showToast('error', res.error || 'Return failed.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // ==========================================
  // RECONCILIATION RUNNER
  // ==========================================

  const handleRunReconciliation = async () => {
    try {
      const res = await apiFetch('/api/v1/pos/reconciliation/run', {
        method: 'POST',
        body: JSON.stringify({
          legal_entity_id: activeLegalEntity?.id || 'le_default',
        }),
      });

      if (res.success) {
        showToast('success', `Reconciliation run finished: ${res.data.status}`);
        loadData();
      } else {
        showToast('error', res.error || 'Reconciliation failed.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#111827]">Point of Sale (POS) & Retail Desk</h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Phase 9 Authoritative
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">Omnichannel Sales Execution • Split Payments • Stock Ledger Integrated</p>
          </div>
        </div>

        {/* Terminal & Shift Status Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <MonitorSmartphone className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 font-medium">Terminal:</span>
            <select
              value={selectedTerminal?.id || ''}
              onChange={(e) => {
                const term = terminals.find((t) => t.id === e.target.value);
                setSelectedTerminal(term || null);
                if (term) fetchActiveSession(term.id);
              }}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              {terminals.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.terminal_code} — {t.terminal_name}
                </option>
              ))}
            </select>
          </div>

          {activeSession ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Shift Open</span>
              <span className="text-slate-400">|</span>
              <span>Drawer: ₹{activeSession.expected_cash}</span>
              <button
                onClick={() => setShowCloseSessionModal(true)}
                className="ml-2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition"
              >
                Close Shift
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-semibold">Shift Closed</span>
              <button
                onClick={() => setShowOpenSessionModal(true)}
                className="ml-2 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition"
              >
                Open Shift
              </button>
            </div>
          )}

          <button
            onClick={loadData}
            className="p-2 border border-[#E5E7EB] hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'register', label: 'Register & Checkout', icon: ShoppingCart },
          { id: 'sessions', label: 'Shifts & Cash Drawer', icon: Clock },
          { id: 'terminals', label: 'POS Terminals', icon: MonitorSmartphone },
          { id: 'held', label: `Held Sales (${heldSales.length})`, icon: PauseCircle },
          { id: 'transactions', label: 'Transactions History', icon: History },
          { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
          { id: 'reconciliation', label: 'Sales Reconciliation', icon: Scale },
          { id: 'offline', label: 'Offline Sync Queue', icon: WifiOff },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* TAB 1: REGISTER & LIVE CHECKOUT */}
        {/* ========================================== */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left: Product Catalog Grid (7 cols) */}
            <div className="lg:col-span-7 flex flex-col bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
              {/* Product Search & Category Filters */}
              <div className="p-4 border-b border-[#E5E7EB] bg-slate-50 flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Scan barcode or search SKU, product name..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {filteredProducts.length} items available
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                    No products found matching search.
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className="p-3 border border-slate-200 hover:border-indigo-500 hover:shadow-md bg-white rounded-lg cursor-pointer transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{p.sku || 'SKU'}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 line-clamp-2">
                          {p.name}
                        </h4>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">₹{p.base_price || p.selling_price || '100.00'}</span>
                        <span className="p-1 rounded bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Cart & Order Summary (5 cols) */}
            <div className="lg:col-span-5 flex flex-col bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
              {/* Cart Header */}
              <div className="p-4 border-b border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-800">Current Cart</h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                    {cart?.items?.length || 0} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHoldModal(true)}
                    disabled={!cart || cart.items.length === 0}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[11px] font-semibold transition disabled:opacity-50"
                  >
                    Hold
                  </button>
                  <button
                    onClick={handleClearCart}
                    disabled={!cart || cart.items.length === 0}
                    className="p-1 hover:bg-rose-50 text-rose-600 rounded transition disabled:opacity-50"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer Selector */}
              <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">Customer:</span>
                </div>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none"
                >
                  <option value="cust_walk_in">Walk-in Customer (Standard)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.trade_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items Table */}
              <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100">
                {!cart || cart.items.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <ShoppingCart className="w-8 h-8 stroke-1 text-slate-300" />
                    <p className="text-xs">Scan or click products on the left to add items.</p>
                  </div>
                ) : (
                  cart.items.map((item: any) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>₹{item.unit_price} each</span>
                          <span>•</span>
                          <span>Tax: {item.tax_rate}%</span>
                          {item.discount_amount !== '0.00' && (
                            <span className="text-emerald-600 font-semibold">-₹{item.discount_amount} disc</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => handleUpdateCartQty(item.id, item.quantity, -1)}
                          className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQty(item.id, item.quantity, 1)}
                          className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-black text-slate-900">₹{item.line_total}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Totals Summary & Checkout CTA */}
              <div className="p-4 border-t border-[#E5E7EB] bg-slate-50 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Gross Subtotal</span>
                  <span>₹{cart?.subtotal || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-600">
                  <span>Total Discounts</span>
                  <span>-₹{cart?.discount_total || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Taxes (GST/Output)</span>
                  <span>+₹{cart?.tax_total || '0.00'}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                  <span>Payable Amount</span>
                  <span className="text-indigo-600 text-base">₹{cart?.grand_total || '0.00'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={openPayment}
                    disabled={!cart || cart.items.length === 0}
                    className="w-full col-span-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Collect Payment & Checkout (₹{cart?.grand_total || '0.00'})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: SHIFTS & CASH DRAWER */}
        {/* ========================================== */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Active Shift Overview Banner */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Shift Context</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Terminal: {selectedTerminal?.terminal_name} ({selectedTerminal?.terminal_code})
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeSession ? `Opened at ${new Date(activeSession.opened_at).toLocaleTimeString()}` : 'No active shift.'}
                </p>
              </div>

              {activeSession && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Expected Cash</span>
                    <h4 className="text-lg font-black text-emerald-600">₹{activeSession.expected_cash}</h4>
                  </div>
                  <button
                    onClick={() => setShowCashMovementModal(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                  >
                    Paid In / Paid Out
                  </button>
                  <button
                    onClick={() => setShowCloseSessionModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Close Shift
                  </button>
                </div>
              )}
            </div>

            {/* Cash Movements Ledger */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900">Shift Cash Drawer Audit Ledger</h4>
                <span className="text-xs text-slate-500">{cashMovements.length} movements recorded</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Movement Type</th>
                      <th className="py-2.5 px-3">Reason / Details</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashMovements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No cash movements recorded in current shift.
                        </td>
                      </tr>
                    ) : (
                      cashMovements.map((cm) => (
                        <tr key={cm.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {new Date(cm.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cm.movement_type === 'OPENING_FLOAT'
                                  ? 'bg-blue-50 text-blue-700'
                                  : cm.movement_type === 'SALE' || cm.movement_type === 'PAID_IN'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {cm.movement_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{cm.reason}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{cm.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Shift Sessions */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Historical Shift Sessions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Session ID</th>
                      <th className="py-2.5 px-3">Terminal</th>
                      <th className="py-2.5 px-3">Opened</th>
                      <th className="py-2.5 px-3">Closed</th>
                      <th className="py-2.5 px-3 text-right">Sales Total</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No shift history found.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{s.id.slice(-8)}</td>
                          <td className="py-2.5 px-3 text-slate-800">{s.terminal_id}</td>
                          <td className="py-2.5 px-3 text-slate-600">{new Date(s.opened_at).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.closed_at ? new Date(s.closed_at).toLocaleString() : '—'}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{s.total_sales_amount}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                            {s.cash_variance ? `₹${s.cash_variance}` : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: POS TERMINALS CONFIGURATION */}
        {/* ========================================== */}
        {activeTab === 'terminals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Configured POS Terminals</h3>
                <p className="text-xs text-slate-500">Manage hardware registers, printers, and branch warehouse routing.</p>
              </div>
              <button
                onClick={() => setShowTerminalModal(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Terminal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {terminals.map((t) => (
                <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-600">{t.terminal_code}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{t.terminal_name}</h4>
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Branch:</span>
                        <span className="font-semibold text-slate-800">{t.branch_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Warehouse:</span>
                        <span className="font-semibold text-slate-800">{t.warehouse_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Printer Format:</span>
                        <span className="font-semibold text-slate-800">{t.hardware_config?.receipt_printer_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {t.current_session_id ? 'Shift Active' : 'No Active Shift'}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedTerminal(t);
                        fetchActiveSession(t.id);
                        setActiveTab('register');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Switch to this</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: HELD SALES */}
        {/* ========================================== */}
        {activeTab === 'held' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Held Sales Queue</h3>
                <p className="text-xs text-slate-500">Temporarily suspended orders waiting for cashier resumption.</p>
              </div>
              <span className="text-xs text-slate-500">{heldSales.length} carts on hold</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Hold Ref</th>
                    <th className="py-2.5 px-3">Held At</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heldSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No sales currently on hold.
                      </td>
                    </tr>
                  ) : (
                    heldSales.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{h.held_reference}</td>
                        <td className="py-2.5 px-3 text-slate-600">{new Date(h.held_at).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-3 text-slate-700">{h.held_reason}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{h.items.length} items</td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-600">₹{h.grand_total}</td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleResumeHeldSale(h.id)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleCancelHeldSale(h.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: TRANSACTIONS HISTORY */}
        {/* ========================================== */}
        {activeTab === 'transactions' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authoritative POS Transactions</h3>
                <p className="text-xs text-slate-500">Immutable record of all retail sales, payment tenders, and receipts.</p>
              </div>
              <span className="text-xs text-slate-500">{transactions.length} transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Transaction #</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Payments</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{tx.transaction_number}</td>
                        <td className="py-2.5 px-3 text-slate-600">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-800">{tx.customer_name || 'Walk-in'}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-600">
                            {tx.payments?.map((p: any) => p.payment_method).join(', ') || 'CASH'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">₹{tx.subtotal}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">₹{tx.tax_total}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{tx.grand_total}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.status === 'REFUNDED'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={async () => {
                              const res = await apiFetch(`/api/v1/pos/transactions/${tx.id}`);
                              if (res.success && res.data?.receipt) {
                                setActiveReceipt(res.data.receipt);
                                setShowReceiptModal(true);
                              }
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="View Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: RETURNS & REFUNDS */}
        {/* ========================================== */}
        {activeTab === 'returns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Returns & Refunds Desk</h3>
                <p className="text-xs text-slate-500">
                  Process item returns against sales receipts with inventory disposition and refund settlement.
                </p>
              </div>
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Process New Return</span>
              </button>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Historical Returns</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Return #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Original Sale</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3">Target Stock</th>
                      <th className="py-2.5 px-3 text-right">Refund Total</th>
                      <th className="py-2.5 px-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No returns processed yet.
                        </td>
                      </tr>
                    ) : (
                      returns.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{r.return_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{r.original_transaction_id.slice(-8)}</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.return_reason}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                              {r.condition}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {r.target_inventory_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-600">₹{r.refund_total}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{r.refund_method}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 7: SALES RECONCILIATION */}
        {/* ========================================== */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Domain Sales Reconciliation</h3>
                <p className="text-xs text-slate-500">
                  Cross-validates POS sales vs. Sales Orders vs. Payment Tenders vs. COGS vs. GL Accounts.
                </p>
              </div>
              <button
                onClick={handleRunReconciliation}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Scale className="w-4 h-4" />
                <span>Run Sales Reconciliation Audit</span>
              </button>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Reconciliation Execution Runs</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Run ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">POS Sales</th>
                      <th className="py-2.5 px-3 text-right">Sales Domain</th>
                      <th className="py-2.5 px-3 text-right">Payments</th>
                      <th className="py-2.5 px-3 text-right">Sales Variance</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reconciliationRuns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No reconciliation runs performed.
                        </td>
                      </tr>
                    ) : (
                      reconciliationRuns.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{r.id.slice(-8)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.reconciliation_date}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{r.pos_sales_total}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">₹{r.sales_order_domain_total}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">₹{r.payment_collection_total}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">₹{r.variance_sales}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'RECONCILED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: OFFLINE SYNC QUEUE */}
        {/* ========================================== */}
        {activeTab === 'offline' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Offline Device Registry</h3>
              <p className="text-xs text-slate-500 mb-4">
                Enables local offline operation, command sequence queuing, and server reconciliation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offlineDevices.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                    No offline devices registered.
                  </div>
                ) : (
                  offlineDevices.map((d) => (
                    <div key={d.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{d.device_name}</h5>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{d.device_identifier}</p>
                        <span className="text-[10px] text-slate-400">Platform: {d.platform} • v{d.app_version}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {d.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sync Conflicts */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Sync Conflict Resolution Center</h4>
              {syncConflicts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Zero sync conflicts. All offline device commands synchronized cleanly.
                </div>
              ) : (
                <div className="space-y-3">
                  {syncConflicts.map((c) => (
                    <div key={c.id} className="p-3 border border-amber-200 bg-amber-50 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-900">{c.conflict_type}</span>
                        <p className="text-xs text-amber-800 mt-0.5">{c.details}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: OPEN SHIFT SESSION */}
      {/* ========================================== */}
      {showOpenSessionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Open POS Register Shift</h3>
              <button onClick={() => setShowOpenSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Notes / Denominations</label>
                <textarea
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. 5x100, 4x50 notes counted"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowOpenSessionModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenSession}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Confirm & Open Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CLOSE SHIFT SESSION */}
      {/* ========================================== */}
      {showCloseSessionModal && activeSession && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Close Shift & Reconcile Drawer</h3>
              <button onClick={() => setShowCloseSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Opening Float:</span>
                  <span className="font-semibold">₹{activeSession.opening_float}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Shift Sales:</span>
                  <span className="font-semibold">₹{activeSession.total_sales_amount}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>System Expected Cash:</span>
                  <span className="text-emerald-600">₹{activeSession.expected_cash}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Counted Physical Cash in Drawer (₹)</label>
                <input
                  type="number"
                  value={closingCountedCash}
                  onChange={(e) => setClosingCountedCash(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Notes / Discrepancy Reason</label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowCloseSessionModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseSession}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Close Shift & Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CASH MOVEMENTS (PAID IN / PAID OUT) */}
      {/* ========================================== */}
      {showCashMovementModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Record Cash Drawer Movement</h3>
              <button onClick={() => setShowCashMovementModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAID_IN', 'PAID_OUT', 'ADJUSTMENT'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCashMovementType(type)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        cashMovementType === type
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={cashMovementAmount}
                  onChange={(e) => setCashMovementAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  value={cashMovementReason}
                  onChange={(e) => setCashMovementReason(e.target.value)}
                  placeholder="e.g. Petty cash for store stationery"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowCashMovementModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashMovementSubmit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                >
                  Record Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CHECKOUT & SPLIT PAYMENT */}
      {/* ========================================== */}
      {showPaymentModal && cart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tender Settlement & Payment</h3>
                <p className="text-xs text-slate-500">Grand Total Payable: ₹{cart.grand_total}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Methods Breakdown */}
              <div className="space-y-2">
                {paymentLines.map((line, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={line.payment_method}
                        onChange={(e) => {
                          const updated = [...paymentLines];
                          updated[idx].payment_method = e.target.value;
                          setPaymentLines(updated);
                        }}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="WALLET">UPI / Digital Wallet</option>
                        <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                        <option value="STORE_CREDIT">Store Credit</option>
                      </select>

                      <input
                        type="number"
                        value={line.amount}
                        onChange={(e) => {
                          const updated = [...paymentLines];
                          updated[idx].amount = e.target.value;
                          updated[idx].tendered_amount = e.target.value;
                          setPaymentLines(updated);
                        }}
                        placeholder="Amount"
                        className="w-28 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-right"
                      />

                      {paymentLines.length > 1 && (
                        <button
                          onClick={() => setPaymentLines(paymentLines.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {line.payment_method === 'CASH' && (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-600">Tendered Cash:</span>
                        <input
                          type="number"
                          value={line.tendered_amount}
                          onChange={(e) => {
                            const updated = [...paymentLines];
                            updated[idx].tendered_amount = e.target.value;
                            setPaymentLines(updated);
                          }}
                          className="w-28 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-right"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Split Payment Button */}
              <button
                type="button"
                onClick={() =>
                  setPaymentLines([
                    ...paymentLines,
                    { payment_method: 'CARD', amount: '0.00', tendered_amount: '0.00', reference_number: '' },
                  ])
                }
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Split Payment Method</span>
              </button>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckoutSubmit}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Confirm & Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: PRINTABLE POS RECEIPT */}
      {/* ========================================== */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Official POS Tax Receipt</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-96 whitespace-pre-wrap">
              {activeReceipt.receipt_body}
            </pre>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">{activeReceipt.receipt_number}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeReceipt.receipt_body);
                    showToast('success', 'Receipt copied to clipboard.');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: REGISTER NEW TERMINAL */}
      {/* ========================================== */}
      {showTerminalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Register POS Terminal</h3>
              <button onClick={() => setShowTerminalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terminal Code</label>
                <input
                  type="text"
                  value={newTerminalCode}
                  onChange={(e) => setNewTerminalCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terminal Name / Counter Description</label>
                <input
                  type="text"
                  value={newTerminalName}
                  onChange={(e) => setNewTerminalName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hardware Printer Type</label>
                <select
                  value={newPrinterType}
                  onChange={(e) => setNewPrinterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="THERMAL">ESC/POS Thermal Slip (80mm)</option>
                  <option value="A4">Standard A4 Laser Invoice</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowTerminalModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTerminal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                >
                  Create Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: PROCESS RETURN & REFUND */}
      {/* ========================================== */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Process Item Return & Refund</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Original Sales Transaction</label>
                <select
                  value={returnSelectedTx?.id || ''}
                  onChange={(e) => {
                    const tx = transactions.find((t) => t.id === e.target.value);
                    if (tx) handleSelectReturnTx(tx);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">-- Choose Transaction --</option>
                  {transactions.map((tx) => (
                    <option key={tx.id} value={tx.id}>
                      {tx.transaction_number} — {tx.customer_name || 'Walk-in'} (₹{tx.grand_total})
                    </option>
                  ))}
                </select>
              </div>

              {returnSelectedTx && (
                <>
                  {/* Items to Return List */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                    <span className="text-xs font-bold text-slate-700">Select Quantities to Return:</span>
                    {returnSelectedTx.lines.map((line: any) => (
                      <div key={line.id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[200px]">{line.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">max {line.quantity}</span>
                          <input
                            type="number"
                            min="0"
                            max={line.quantity}
                            value={returnQuantities[line.id] || 0}
                            onChange={(e) =>
                              setReturnQuantities({
                                ...returnQuantities,
                                [line.id]: Number(e.target.value),
                              })
                            }
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-center font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Item Physical Condition</label>
                      <select
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value as any)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                      >
                        <option value="RESELLABLE">Resellable (Pristine)</option>
                        <option value="DAMAGED">Damaged</option>
                        <option value="DEFECTIVE">Defective</option>
                        <option value="QUARANTINE">Quarantine Needed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Stock Ledger Status</label>
                      <select
                        value={returnTargetStatus}
                        onChange={(e) => setReturnTargetStatus(e.target.value as any)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                      >
                        <option value="AVAILABLE">Available for Sale</option>
                        <option value="DAMAGED">Damaged Location</option>
                        <option value="QUARANTINED">Quarantined Stock</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Method</label>
                    <select
                      value={returnMethod}
                      onChange={(e) => setReturnMethod(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                    >
                      <option value="CASH">Cash Refund</option>
                      <option value="STORE_CREDIT">Store Credit / Voucher</option>
                      <option value="ORIGINAL_PAYMENT">Original Payment Reversal</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessReturn}
                  disabled={!returnSelectedTx}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  Execute Return & Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: HOLD SALE */}
      {/* ========================================== */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Hold Active Sale</h3>
              <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Reference Label</label>
                <input
                  type="text"
                  value={holdRef}
                  onChange={(e) => setHoldRef(e.target.value)}
                  placeholder="e.g. Table 4 / Blue Shirt Customer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Hold</label>
                <input
                  type="text"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g. Customer getting more items"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHoldSale}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Hold Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
