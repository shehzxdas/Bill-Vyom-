import React, { useState, useEffect } from 'react';
import {
  Layers,
  Box,
  Warehouse,
  ArrowRightLeft,
  BookmarkCheck,
  ClipboardList,
  SlidersHorizontal,
  DollarSign,
  Scale,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  XCircle,
  Eye,
  ShieldAlert,
  BarChart3,
  Archive,
  FileCheck,
  Hash,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

export default function InventoryPage() {
  const { token, activeTenant, activeLegalEntity } = useTenant();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'stock'
    | 'ledger'
    | 'warehouses'
    | 'transfers'
    | 'reservations'
    | 'counts'
    | 'adjustments'
    | 'tracking'
    | 'valuation'
    | 'reconciliation'
    | 'settings'
  >('dashboard');

  // Loading & data states
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [stockBalances, setStockBalances] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [serials, setSerials] = useState<any[]>([]);
  const [valuationReport, setValuationReport] = useState<any>(null);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [policySettings, setPolicySettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState<
    | null
    | 'movement'
    | 'transfer'
    | 'reservation'
    | 'adjustment'
    | 'count'
    | 'location'
    | 'zone'
    | 'lot'
    | 'serial'
    | 'rebuild'
  >(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [movementForm, setMovementForm] = useState({
    warehouse_id: '',
    product_id: '',
    quantity: 1,
    movement_type: 'RECEIPT',
    unit_cost: '100.00',
    source_type: 'MANUAL_ADJUSTMENT',
    source_id: 'MANUAL',
    location_id: '',
    lot_id: '',
    serial_number: '',
  });

  const [transferForm, setTransferForm] = useState({
    source_warehouse_id: '',
    destination_warehouse_id: '',
    product_id: '',
    quantity: 1,
    notes: '',
  });

  const [reservationForm, setReservationForm] = useState({
    warehouse_id: '',
    product_id: '',
    quantity: 1,
    source_type: 'MANUAL_HOLD',
    source_id: `DEMAND-${Date.now().toString().slice(-4)}`,
    notes: '',
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    warehouse_id: '',
    product_id: '',
    quantity: 1,
    adjustment_type: 'INCREASE',
    unit_cost: '100.00',
    reason_code: 'CYCLE_COUNT_VARIANCE',
    reason_description: 'Physical inventory count adjustment',
  });

  const [countForm, setCountForm] = useState({
    warehouse_id: '',
    count_name: `Quarterly Count ${new Date().toLocaleDateString()}`,
    count_type: 'FULL',
    is_blind_mode: false,
  });

  const [locationForm, setLocationForm] = useState({
    warehouse_id: '',
    zone_id: '',
    location_code: '',
    location_type: 'STORAGE',
    aisle: 'A1',
    rack: 'R1',
    shelf: 'S1',
    bin: 'B1',
  });

  const [zoneForm, setZoneForm] = useState({
    warehouse_id: '',
    zone_code: 'ZONE-A',
    zone_name: 'Primary Storage Zone',
    zone_type: 'GENERAL_STORAGE',
  });

  const [lotForm, setLotForm] = useState({
    product_id: '',
    batch_number: `BATCH-${Date.now().toString().slice(-4)}`,
    expiry_date: '',
    shelf_life_days: 180,
  });

  const [serialForm, setSerialForm] = useState({
    product_id: '',
    warehouse_id: '',
    serial_number: `SN-${Date.now().toString().slice(-6)}`,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || localStorage.getItem('token') || ''}`,
  });

  // Fetch all inventory data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      const [
        dashRes,
        stockRes,
        movRes,
        whRes,
        locRes,
        zoneRes,
        trfRes,
        resRes,
        cntRes,
        adjRes,
        lotRes,
        serRes,
        valRes,
        recRes,
        setRes,
        prodRes,
      ] = await Promise.all([
        fetch('/api/v1/inventory/dashboard', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/stock', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/movements', { headers }).then((r) => r.json()),
        fetch('/api/v1/master/warehouses', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/locations', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/zones', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/transfers', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/reservations', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/counts', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/adjustments', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/lots', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/serials', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/valuation/report', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/reconciliations', { headers }).then((r) => r.json()),
        fetch('/api/v1/inventory/settings', { headers }).then((r) => r.json()),
        fetch('/api/v1/master/products', { headers }).then((r) => r.json()),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (stockRes.success) setStockBalances(stockRes.data);
      if (movRes.success) setMovements(movRes.data);
      if (whRes.success) setWarehouses(whRes.data);
      if (locRes.success) setLocations(locRes.data);
      if (zoneRes.success) setZones(zoneRes.data);
      if (trfRes.success) setTransfers(trfRes.data);
      if (resRes.success) setReservations(resRes.data);
      if (cntRes.success) setCounts(cntRes.data);
      if (adjRes.success) setAdjustments(adjRes.data);
      if (lotRes.success) setLots(lotRes.data);
      if (serRes.success) setSerials(serRes.data);
      if (valRes.success) setValuationReport(valRes.data);
      if (recRes.success) setReconciliations(recRes.data);
      if (setRes.success) setPolicySettings(setRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err: any) {
      console.error('Failed to load inventory data:', err);
      showNotification('error', err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handler: Record Movement
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/movements', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...movementForm,
          quantity: Number(movementForm.quantity),
          unit_cost: movementForm.unit_cost,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Movement failed');
      showNotification('success', 'Stock movement recorded and ledger updated.');
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Transfer
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/transfers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          source_warehouse_id: transferForm.source_warehouse_id,
          destination_warehouse_id: transferForm.destination_warehouse_id,
          notes: transferForm.notes,
          lines: [
            {
              product_id: transferForm.product_id,
              quantity: Number(transferForm.quantity),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Transfer failed');
      showNotification('success', 'Stock transfer created successfully.');
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Ship Transfer
  const handleShipTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/transfers/${id}/ship`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Shipment failed');
      showNotification('success', 'Stock transfer dispatched to IN_TRANSIT status.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Receive Transfer
  const handleReceiveTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/transfers/${id}/receive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Receive failed');
      showNotification('success', 'Stock transfer received into destination warehouse.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Reservation
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/reservations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...reservationForm,
          quantity: Number(reservationForm.quantity),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Reservation failed');
      showNotification('success', 'Stock reservation confirmed.');
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Release Reservation
  const handleReleaseReservation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/reservations/${id}/release`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Release failed');
      showNotification('success', 'Stock reservation released back to available inventory.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Stock Count
  const handleCreateCount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/counts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(countForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Count creation failed');
      showNotification('success', 'Stock count session initialized.');
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Approve Count
  const handleApproveCount = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/counts/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Approval failed');
      showNotification('success', 'Count approved and compensating ledger adjustments posted.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Adjustment
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/adjustments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          warehouse_id: adjustmentForm.warehouse_id,
          reason_code: adjustmentForm.reason_code,
          reason_description: adjustmentForm.reason_description,
          lines: [
            {
              product_id: adjustmentForm.product_id,
              quantity: Number(adjustmentForm.quantity),
              adjustment_type: adjustmentForm.adjustment_type,
              unit_cost: adjustmentForm.unit_cost,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Adjustment creation failed');
      showNotification('success', 'Stock adjustment recorded.');
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Approve Adjustment
  const handleApproveAdjustment = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/adjustments/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Approval failed');
      showNotification('success', 'Adjustment approved and stock ledger updated.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Run Reconciliation
  const handleRunReconciliation = async () => {
    try {
      const res = await fetch('/api/v1/inventory/reconciliations/run', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Reconciliation run failed');
      showNotification(
        'success',
        `Reconciliation complete. Status: ${data.data.status} (Variance: ₹${data.data.variance_amount})`
      );
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Rebuild Projections
  const handleRebuildProjections = async () => {
    try {
      const res = await fetch('/api/v1/inventory/rebuild-projections', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Rebuild failed');
      showNotification(
        'success',
        `Projections rebuilt from ${data.data.rebuilt_movements_count} immutable movements. Total Valuation: ₹${data.data.total_rebuilt_valuation}`
      );
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Location
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/locations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(locationForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Location creation failed');
      showNotification('success', `Location '${data.data.location_code}' created.`);
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/zones', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(zoneForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Zone creation failed');
      showNotification('success', `Zone '${data.data.zone_code}' created.`);
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Create Lot
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/lots', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(lotForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Lot creation failed');
      showNotification('success', `Lot '${data.data.batch_number}' registered.`);
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Register Serial
  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/serials', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(serialForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Serial registration failed');
      showNotification('success', `Serial Number '${data.data.serial_number}' registered.`);
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handler: Update Policy Settings
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/inventory/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(policySettings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0]?.message || 'Policy update failed');
      showNotification('success', 'Inventory policies saved.');
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Filtered Stock Balances
  const filteredStock = stockBalances.filter((b) => {
    const matchesSearch =
      (b.sku && b.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.product_name && b.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.warehouse_name && b.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesWh = !selectedWarehouseFilter || b.warehouse_id === selectedWarehouseFilter;
    return matchesSearch && matchesWh;
  });

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Global Inventory & Warehouses</h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded">
              Phase 8 Authoritative
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Authoritative stock ledger, multi-warehouse zones, lot/serial tracking, FIFO valuation & GL reconciliation.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveModal('movement')}
            className="px-3.5 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Record Movement
          </button>
          <button
            onClick={() => setActiveModal('transfer')}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Stock
          </button>
          <button
            onClick={() => setActiveModal('reservation')}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookmarkCheck className="w-3.5 h-3.5" /> Reserve Stock
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="px-6 py-2 bg-white border-b border-gray-200 flex gap-4 overflow-x-auto text-xs font-bold scrollbar-none">
        {[
          { key: 'dashboard', label: 'Overview', icon: BarChart3 },
          { key: 'stock', label: 'Stock Balances', icon: Box },
          { key: 'ledger', label: 'Stock Ledger (Audit)', icon: ClipboardList },
          { key: 'warehouses', label: 'Warehouses & Bins', icon: Warehouse },
          { key: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
          { key: 'reservations', label: 'Reservations', icon: BookmarkCheck },
          { key: 'counts', label: 'Cycle Counts', icon: FileCheck },
          { key: 'adjustments', label: 'Adjustments', icon: SlidersHorizontal },
          { key: 'tracking', label: 'Lots & Serials', icon: Hash },
          { key: 'valuation', label: 'Valuation (FIFO)', icon: DollarSign },
          { key: 'reconciliation', label: 'GL Reconciliation', icon: Scale },
          { key: 'settings', label: 'Policy Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 flex-1">
        {/* TAB 1: OVERVIEW / DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                  <span>Total Inventory Value</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  ₹{dashboardData?.metrics?.total_valuation || '0.00'}
                </div>
                <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <span className="font-semibold text-emerald-600">FIFO</span> perpetual subledger
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                  <span>Physical On-Hand Units</span>
                  <Box className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {dashboardData?.metrics?.total_on_hand || 0}{' '}
                  <span className="text-xs font-normal text-gray-500">units</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                  <span>Available: {dashboardData?.metrics?.total_available || 0}</span>
                  <span>Reserved: {dashboardData?.metrics?.total_reserved || 0}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                  <span>Low Stock & Expiry Alerts</span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold text-amber-600 mt-1">
                  {dashboardData?.metrics?.low_stock_alerts || 0}{' '}
                  <span className="text-xs font-normal text-gray-500">reorder items</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Expiring lots: {dashboardData?.metrics?.expiring_lots_count || 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                  <span>Active Operations</span>
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {(dashboardData?.metrics?.in_transit_transfers || 0) +
                    (dashboardData?.metrics?.active_reservations || 0)}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  In-Transit: {dashboardData?.metrics?.in_transit_transfers || 0} | Reserved:{' '}
                  {dashboardData?.metrics?.active_reservations || 0}
                </div>
              </div>
            </div>

            {/* Quick Actions & Audit Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#1E3A8A]" />
                  Inventory Controls & Maintenance
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Execute authoritative transactions or run mathematical verification on derived projections.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setActiveModal('movement')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg border border-gray-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Record Direct Stock Movement</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveModal('count')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg border border-gray-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Start Physical / Cycle Count Session</span>
                    <FileCheck className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={handleRunReconciliation}
                    className="w-full text-left px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg border border-gray-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Reconcile Subledger vs GL Inventory</span>
                    <Scale className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveModal('rebuild')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-gray-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Rebuild Projections from Immutable Ledger</span>
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Recent Movements Stream */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
                      Recent Stock Ledger Movements (Immutable)
                    </h3>
                    <button
                      onClick={() => setActiveTab('ledger')}
                      className="text-xs text-[#1E3A8A] font-semibold hover:underline cursor-pointer"
                    >
                      View Full Ledger &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {dashboardData?.recent_movements?.length > 0 ? (
                      dashboardData.recent_movements.map((m: any) => (
                        <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span
                              className={`p-1.5 rounded ${
                                m.direction === 'IN'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {m.direction === 'IN' ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <div className="font-bold text-gray-800">
                                {m.movement_type} &bull; {m.sku}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {new Date(m.movement_date).toLocaleString()} &bull; Source: {m.source_type} (
                                {m.source_id})
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {m.direction === 'IN' ? '+' : '-'}
                              {m.quantity} units
                            </div>
                            <div className="text-[11px] text-gray-500">₹{m.total_cost}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No stock movements recorded yet. Use 'Record Movement' or receive purchase goods.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK BALANCES */}
        {activeTab === 'stock' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Search & Warehouse Filter */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by SKU, product name, warehouse..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <select
                  value={selectedWarehouseFilter}
                  onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A] bg-white cursor-pointer"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{filteredStock.length}</span> balance projections
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Warehouse / Location</th>
                    <th className="py-3 px-4 text-right">Physical On-Hand</th>
                    <th className="py-3 px-4 text-right">Reserved</th>
                    <th className="py-3 px-4 text-right">Available</th>
                    <th className="py-3 px-4 text-right">Avg Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Valuation</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredStock.length > 0 ? (
                    filteredStock.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{b.sku}</div>
                          <div className="text-[11px] text-gray-500">{b.product_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900">{b.warehouse_name}</div>
                          <div className="text-[11px] text-gray-400">{b.location_code}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{b.on_hand_quantity}</td>
                        <td className="py-3 px-4 text-right text-purple-600 font-semibold">{b.reserved_quantity}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">{b.available_quantity}</td>
                        <td className="py-3 px-4 text-right text-gray-600">₹{b.unit_cost_average}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">₹{b.total_valuation}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.available_quantity > 5
                                ? 'bg-emerald-50 text-emerald-700'
                                : b.available_quantity > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {b.available_quantity > 5 ? 'IN_STOCK' : b.available_quantity > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                        No inventory stock balances match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STOCK LEDGER (AUDIT TRAIL) */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Immutable Stock Ledger</h3>
                <p className="text-xs text-gray-500">
                  Authoritative chronological journal of every inventory movement across all warehouses.
                </p>
              </div>
              <button
                onClick={() => setActiveModal('movement')}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record Movement
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Movement ID / Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">SKU / Product</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4">Source Ref</th>
                    <th className="py-3 px-4">GL Entry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{m.movement_id}</div>
                          <div className="text-[11px] text-gray-400">{new Date(m.movement_date).toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.direction === 'IN'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {m.movement_type} ({m.direction})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{m.sku}</div>
                          <div className="text-[11px] text-gray-500">{m.product_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{m.warehouse_name}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          {m.direction === 'IN' ? '+' : '-'}
                          {m.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">₹{m.unit_cost}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">₹{m.total_cost}</td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {m.source_type} #{m.source_id}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {m.journal_entry_id ? (
                            <span className="text-emerald-700 font-semibold">#{m.journal_entry_id}</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-gray-400">
                        No ledger movements recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WAREHOUSES & LOCATIONS */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Warehouse Storage Hierarchy</h3>
                  <p className="text-xs text-gray-500">
                    Warehouses &rarr; Zones &rarr; Aisle / Rack / Shelf / Bin Locations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModal('zone')}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Zone
                  </button>
                  <button
                    onClick={() => setActiveModal('location')}
                    className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bin Location
                  </button>
                </div>
              </div>

              {/* Warehouses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses.map((wh) => {
                  const whLocs = locations.filter((l) => l.warehouse_id === wh.id);
                  const whZones = zones.filter((z) => z.warehouse_id === wh.id);
                  return (
                    <div key={wh.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-[#1E3A8A]" />
                          {wh.name}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {wh.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Code: <span className="font-semibold text-gray-700">{wh.code}</span> &bull; Type:{' '}
                        <span className="font-semibold text-gray-700">{wh.type || 'PHYSICAL'}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                        <span>{whZones.length} Zones</span>
                        <span>{whLocs.length} Bins Configured</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Locations List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-900">Configured Storage Locations & Bins</h4>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Location Code</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Zone</th>
                    <th className="py-3 px-4">Aisle / Rack / Shelf / Bin</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{loc.location_code}</td>
                        <td className="py-3 px-4 text-gray-700">{loc.warehouse_name}</td>
                        <td className="py-3 px-4 text-gray-700">{loc.zone_name}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {loc.aisle || '-'}/{loc.rack || '-'}/{loc.shelf || '-'}/{loc.bin || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{loc.location_type}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {loc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                        No locations configured yet. Add your first storage bin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: STOCK TRANSFERS */}
        {activeTab === 'transfers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Inter-Warehouse Stock Transfers</h3>
                <p className="text-xs text-gray-500">Multi-step Transfer: Draft &rarr; In-Transit &rarr; Received</p>
              </div>
              <button
                onClick={() => setActiveModal('transfer')}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Transfer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Transfer Number</th>
                    <th className="py-3 px-4">Source Warehouse</th>
                    <th className="py-3 px-4">Destination Warehouse</th>
                    <th className="py-3 px-4">Lines Count</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {transfers.length > 0 ? (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{t.transfer_number}</div>
                          <div className="text-[11px] text-gray-400">{new Date(t.transfer_date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{t.source_warehouse_name}</td>
                        <td className="py-3 px-4 text-gray-700">{t.destination_warehouse_name}</td>
                        <td className="py-3 px-4 text-gray-900 font-bold">{t.lines?.length || 0} items</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'RECEIVED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : t.status === 'IN_TRANSIT'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {t.status === 'APPROVED' && (
                            <button
                              onClick={() => handleShipTransfer(t.id)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Ship Transfer
                            </button>
                          )}
                          {t.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleReceiveTransfer(t.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Receive Goods
                            </button>
                          )}
                          {t.status === 'RECEIVED' && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                        No stock transfers initiated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: RESERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Stock Demand Reservations</h3>
                <p className="text-xs text-gray-500">
                  Allocates physical on-hand stock for confirmed orders to prevent overselling.
                </p>
              </div>
              <button
                onClick={() => setActiveModal('reservation')}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Reservation
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Reservation #</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4 text-right">Qty Reserved</th>
                    <th className="py-3 px-4 text-right">Qty Fulfilled</th>
                    <th className="py-3 px-4">Source Demand</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {reservations.length > 0 ? (
                    reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{r.reservation_number}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{r.sku}</div>
                          <div className="text-[11px] text-gray-500">{r.product_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{r.warehouse_name}</td>
                        <td className="py-3 px-4 text-right font-bold text-purple-700">{r.quantity_reserved}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{r.quantity_fulfilled}</td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {r.source_type} #{r.source_id}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'RESERVED'
                                ? 'bg-purple-50 text-purple-700'
                                : r.status === 'RELEASED'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.status === 'RESERVED' && (
                            <button
                              onClick={() => handleReleaseReservation(r.id)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-bold cursor-pointer"
                            >
                              Release Hold
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                        No active stock reservations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: CYCLE COUNTS */}
        {activeTab === 'counts' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Physical & Cycle Stock Counts</h3>
                <p className="text-xs text-gray-500">
                  Audit physical warehouse inventory. Variances generate controlled compensating adjustments.
                </p>
              </div>
              <button
                onClick={() => setActiveModal('count')}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Start Count Session
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Count Number / Name</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Blind Mode</th>
                    <th className="py-3 px-4">Lines Counted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {counts.length > 0 ? (
                    counts.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{c.count_number}</div>
                          <div className="text-[11px] text-gray-500">{c.count_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{c.warehouse_name}</td>
                        <td className="py-3 px-4 text-gray-600">{c.count_type}</td>
                        <td className="py-3 px-4 text-gray-600">{c.is_blind_mode ? 'Yes (Blind)' : 'No (Standard)'}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">{c.lines?.length || 0} items</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'POSTED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {c.status !== 'POSTED' && (
                            <button
                              onClick={() => handleApproveCount(c.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Approve & Post Adjustments
                            </button>
                          )}
                          {c.status === 'POSTED' && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Adjustments Posted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-gray-400">
                        No cycle count sessions registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: ADJUSTMENTS */}
        {activeTab === 'adjustments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Stock Adjustments</h3>
                <p className="text-xs text-gray-500">
                  Authorized write-offs, scrap, initial balances, and cycle count variance postings.
                </p>
              </div>
              <button
                onClick={() => setActiveModal('adjustment')}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record Adjustment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Adjustment # / Date</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Reason Code</th>
                    <th className="py-3 px-4 text-right">Adjustment Value</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {adjustments.length > 0 ? (
                    adjustments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{a.adjustment_number}</div>
                          <div className="text-[11px] text-gray-400">{new Date(a.adjustment_date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{a.warehouse_name}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{a.reason_code}</div>
                          <div className="text-[11px] text-gray-400">{a.reason_description}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">₹{a.total_adjustment_value}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.status === 'POSTED' || a.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {a.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => handleApproveAdjustment(a.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Approve Adjustment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                        No stock adjustments on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: LOTS & SERIALS TRACKING */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            {/* Lots / Batches */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Lot & Batch Tracking</h3>
                  <p className="text-xs text-gray-500">Track manufacture batches, shelf life, and expiry dates.</p>
                </div>
                <button
                  onClick={() => setActiveModal('lot')}
                  className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Batch
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Manufacture Date</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Shelf Life</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {lots.length > 0 ? (
                      lots.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{l.batch_number}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{l.sku}</div>
                            <div className="text-[11px] text-gray-500">{l.product_name}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{l.manufacture_date || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">{l.expiry_date || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">{l.shelf_life_days ? `${l.shelf_life_days} days` : 'N/A'}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.status === 'VALID'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : l.status === 'EXPIRING'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                          No batch lots registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Serial Numbers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Serial Number Lifecycle Tracking</h3>
                  <p className="text-xs text-gray-500">Individual unit traceability and warranty status.</p>
                </div>
                <button
                  onClick={() => setActiveModal('serial')}
                  className="px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Serial
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Current Warehouse</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {serials.length > 0 ? (
                      serials.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{s.serial_number}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{s.sku}</div>
                            <div className="text-[11px] text-gray-500">{s.product_name}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{s.warehouse_name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.status === 'IN_STOCK'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : s.status === 'ISSUED'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                          No serial numbers registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: VALUATION REPORT */}
        {activeTab === 'valuation' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Perpetual Inventory Valuation Report</h3>
                <p className="text-xs text-gray-500">
                  Calculated under FIFO Layer Exhaustion and Moving Weighted Average costing.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium">Total Balance Valuation</div>
                <div className="text-xl font-bold text-emerald-700">₹{valuationReport?.total_valuation || '0.00'}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4 text-right">On-Hand Qty</th>
                    <th className="py-3 px-4 text-right">Available Qty</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {valuationReport?.items?.length > 0 ? (
                    valuationReport.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{item.sku}</div>
                          <div className="text-[11px] text-gray-500">{item.product_name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{item.warehouse_name}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{item.on_hand}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-700">{item.available}</td>
                        <td className="py-3 px-4 text-right text-gray-600">₹{item.unit_cost}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">₹{item.total_value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                        No inventory balances to valuate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 11: GL RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Subledger vs GL Inventory Control Reconciliation</h3>
                <p className="text-xs text-gray-500">
                  Compares the physical stock valuation with the General Ledger Account 1300 balance.
                </p>
              </div>
              <button
                onClick={handleRunReconciliation}
                className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-4 h-4" /> Run Reconciliation Check
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {reconciliations.length > 0 ? (
                reconciliations.map((rec) => (
                  <div key={rec.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{rec.run_number}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'RECONCILED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(rec.reconciliation_date).toLocaleString()}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-gray-500">Subledger Total:</span>{' '}
                        <span className="font-bold text-gray-900">₹{rec.subledger_valuation_total}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">GL Account Total:</span>{' '}
                        <span className="font-bold text-gray-900">₹{rec.gl_inventory_account_total}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Variance:</span>{' '}
                        <span
                          className={`font-bold ${
                            rec.variance_amount === '0.00' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          ₹{rec.variance_amount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  No reconciliation runs recorded yet. Click 'Run Reconciliation Check'.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 12: SETTINGS */}
        {activeTab === 'settings' && policySettings && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Authoritative Inventory Policies</h3>
            <p className="text-xs text-gray-500 mb-6">
              Configure tenant-wide operational boundaries for stock movements, costing methods, and approval controls.
            </p>

            <form onSubmit={handleUpdatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Negative Stock Policy</label>
                <select
                  value={policySettings.negative_stock_policy}
                  onChange={(e) =>
                    setPolicySettings({ ...policySettings, negative_stock_policy: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A] bg-white"
                >
                  <option value="BLOCK_NEGATIVE">BLOCK_NEGATIVE (Strict - Prohibit stock reduction below zero)</option>
                  <option value="WARN_ON_NEGATIVE">WARN_ON_NEGATIVE (Allow with supervisor warning flag)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Default Costing Method</label>
                <select
                  value={policySettings.default_costing_method}
                  onChange={(e) =>
                    setPolicySettings({ ...policySettings, default_costing_method: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A] bg-white"
                >
                  <option value="FIFO">FIFO (First-In, First-Out Cost Layers)</option>
                  <option value="WEIGHTED_AVERAGE">Moving Weighted Average Costing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Require Adjustment Approval Above Amount (₹)
                </label>
                <input
                  type="text"
                  value={policySettings.require_adjustment_approval_above_amount}
                  onChange={(e) =>
                    setPolicySettings({
                      ...policySettings,
                      require_adjustment_approval_above_amount: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Policy Configuration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ==========================================
          MODALS
      ========================================== */}

      {/* Modal: Record Movement */}
      {activeModal === 'movement' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Record Stock Movement</h3>
            <form onSubmit={handleRecordMovement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Movement Type</label>
                  <select
                    value={movementForm.movement_type}
                    onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="RECEIPT">RECEIPT (Goods In)</option>
                    <option value="ISSUE">ISSUE (Goods Out / Consumption)</option>
                    <option value="ADJUSTMENT_IN">ADJUSTMENT_IN (Positive Variance)</option>
                    <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT (Negative Variance)</option>
                    <option value="DAMAGE">DAMAGE (Scrap / Broken)</option>
                    <option value="QUARANTINE">QUARANTINE (Hold)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                  <select
                    value={movementForm.warehouse_id}
                    onChange={(e) => setMovementForm({ ...movementForm, warehouse_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Product</label>
                  <select
                    value={movementForm.product_id}
                    onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit Cost (₹)</label>
                  <input
                    type="text"
                    value={movementForm.unit_cost}
                    onChange={(e) => setMovementForm({ ...movementForm, unit_cost: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bin Location (Optional)</label>
                  <select
                    value={movementForm.location_id}
                    onChange={(e) => setMovementForm({ ...movementForm, location_id: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Default Location</option>
                    {locations
                      .filter((l) => !movementForm.warehouse_id || l.warehouse_id === movementForm.warehouse_id)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.location_code}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Post Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Stock */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Create Inter-Warehouse Transfer</h3>
            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Source Warehouse</label>
                  <select
                    value={transferForm.source_warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, source_warehouse_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Origin...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Destination Warehouse</label>
                  <select
                    value={transferForm.destination_warehouse_id}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, destination_warehouse_id: e.target.value })
                    }
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Destination...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Product</label>
                  <select
                    value={transferForm.product_id}
                    onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Transfer Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Stock balancing for store replenishment"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reserve Stock */}
      {activeModal === 'reservation' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Reserve Stock</h3>
            <form onSubmit={handleCreateReservation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                <select
                  value={reservationForm.warehouse_id}
                  onChange={(e) => setReservationForm({ ...reservationForm, warehouse_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product</label>
                <select
                  value={reservationForm.product_id}
                  onChange={(e) => setReservationForm({ ...reservationForm, product_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Quantity to Reserve</label>
                <input
                  type="number"
                  min="1"
                  value={reservationForm.quantity}
                  onChange={(e) => setReservationForm({ ...reservationForm, quantity: Number(e.target.value) })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notes / Order Ref</label>
                <input
                  type="text"
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                  placeholder="e.g. Sales order reservation"
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Count Session */}
      {activeModal === 'count' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Initialize Stock Count Session</h3>
            <form onSubmit={handleCreateCount} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                <select
                  value={countForm.warehouse_id}
                  onChange={(e) => setCountForm({ ...countForm, warehouse_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Count Session Name</label>
                <input
                  type="text"
                  value={countForm.count_name}
                  onChange={(e) => setCountForm({ ...countForm, count_name: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Count Type</label>
                <select
                  value={countForm.count_type}
                  onChange={(e) => setCountForm({ ...countForm, count_type: e.target.value as any })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="FULL">FULL (Entire Warehouse)</option>
                  <option value="CYCLE">CYCLE (Periodic Cycle Count)</option>
                  <option value="LOCATION_SPECIFIC">LOCATION_SPECIFIC</option>
                  <option value="PRODUCT_SPECIFIC">PRODUCT_SPECIFIC</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="blind_mode"
                  checked={countForm.is_blind_mode}
                  onChange={(e) => setCountForm({ ...countForm, is_blind_mode: e.target.checked })}
                  className="rounded text-[#1E3A8A]"
                />
                <label htmlFor="blind_mode" className="font-semibold text-gray-700 cursor-pointer">
                  Blind Count Mode (Hide expected quantities from counters)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Start Count Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjustment */}
      {activeModal === 'adjustment' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Record Stock Adjustment</h3>
            <form onSubmit={handleCreateAdjustment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentForm.adjustment_type}
                    onChange={(e) =>
                      setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value as any })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="INCREASE">INCREASE (Add Stock)</option>
                    <option value="DECREASE">DECREASE (Reduce Stock)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                  <select
                    value={adjustmentForm.warehouse_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, warehouse_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Product</label>
                  <select
                    value={adjustmentForm.product_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, product_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason Code</label>
                <select
                  value={adjustmentForm.reason_code}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason_code: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="CYCLE_COUNT_VARIANCE">CYCLE_COUNT_VARIANCE</option>
                  <option value="DAMAGED_GOODS">DAMAGED_GOODS</option>
                  <option value="EXPIRED_GOODS">EXPIRED_GOODS</option>
                  <option value="SCRAP">SCRAP</option>
                  <option value="INITIAL_MIGRATION">INITIAL_MIGRATION</option>
                  <option value="INTERNAL_CONSUMPTION">INTERNAL_CONSUMPTION</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rebuild Projections */}
      {activeModal === 'rebuild' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Rebuild Derived Projections</h3>
                <p className="text-xs text-gray-500">Mathematical replay of all immutable movements</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
              This process replays every immutable <span className="font-bold">InventoryMovement</span> ledger record in
              chronological sequence, recalculating all derived on-hand, reserved, available balances, FIFO cost
              layers, and valuations from scratch with 100% mathematical integrity.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRebuildProjections}
                className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold text-xs cursor-pointer"
              >
                Execute Rebuild
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Location */}
      {activeModal === 'location' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Add Storage Bin Location</h3>
            <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                <select
                  value={locationForm.warehouse_id}
                  onChange={(e) => setLocationForm({ ...locationForm, warehouse_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Location Code</label>
                <input
                  type="text"
                  placeholder="e.g. LOC-A1-R1-S1-B1"
                  value={locationForm.location_code}
                  onChange={(e) => setLocationForm({ ...locationForm, location_code: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Aisle</label>
                  <input
                    type="text"
                    value={locationForm.aisle}
                    onChange={(e) => setLocationForm({ ...locationForm, aisle: e.target.value })}
                    className="w-full p-1.5 border border-gray-200 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Rack</label>
                  <input
                    type="text"
                    value={locationForm.rack}
                    onChange={(e) => setLocationForm({ ...locationForm, rack: e.target.value })}
                    className="w-full p-1.5 border border-gray-200 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Shelf</label>
                  <input
                    type="text"
                    value={locationForm.shelf}
                    onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                    className="w-full p-1.5 border border-gray-200 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Bin</label>
                  <input
                    type="text"
                    value={locationForm.bin}
                    onChange={(e) => setLocationForm({ ...locationForm, bin: e.target.value })}
                    className="w-full p-1.5 border border-gray-200 rounded outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Zone */}
      {activeModal === 'zone' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Add Warehouse Zone</h3>
            <form onSubmit={handleCreateZone} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                <select
                  value={zoneForm.warehouse_id}
                  onChange={(e) => setZoneForm({ ...zoneForm, warehouse_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Zone Code</label>
                <input
                  type="text"
                  placeholder="e.g. ZONE-A"
                  value={zoneForm.zone_code}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone_code: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ambient Storage Floor"
                  value={zoneForm.zone_name}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone_name: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Lot */}
      {activeModal === 'lot' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Register Batch / Lot</h3>
            <form onSubmit={handleCreateLot} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product</label>
                <select
                  value={lotForm.product_id}
                  onChange={(e) => setLotForm({ ...lotForm, product_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={lotForm.batch_number}
                  onChange={(e) => setLotForm({ ...lotForm, batch_number: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={lotForm.expiry_date}
                  onChange={(e) => setLotForm({ ...lotForm, expiry_date: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Register Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Serial */}
      {activeModal === 'serial' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Register Serial Number</h3>
            <form onSubmit={handleRegisterSerial} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product</label>
                <select
                  value={serialForm.product_id}
                  onChange={(e) => setSerialForm({ ...serialForm, product_id: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Warehouse</label>
                <select
                  value={serialForm.warehouse_id}
                  onChange={(e) => setSerialForm({ ...serialForm, warehouse_id: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#1E3A8A]"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialForm.serial_number}
                  onChange={(e) => setSerialForm({ ...serialForm, serial_number: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg font-semibold cursor-pointer"
                >
                  Register Serial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
