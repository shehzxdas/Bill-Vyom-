import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Building,
  Box,
  UserCheck,
  Settings as SettingsIcon,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';

export default function TenantDashboard() {
  const { tenant, legalEntity, branch, isLoading } = useTenant();

  const [counts, setCounts] = useState({
    customers: 0,
    vendors: 0,
    products: 0,
    users: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);

  const fetchRealCounts = async () => {
    setLoadingCounts(true);
    const token = localStorage.getItem('billvyom_jwt_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [custRes, vendRes, prodRes, userRes] = await Promise.all([
        fetch('/api/v1/master/customers?limit=1', { headers }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/v1/master/vendors?limit=1', { headers }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/v1/master/products?limit=1', { headers }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/v1/tenant/users', { headers }).then((r) => r.json()).catch(() => ({})),
      ]);

      setCounts({
        customers: custRes.pagination?.total || (custRes.data?.length ?? 0),
        vendors: vendRes.pagination?.total || (vendRes.data?.length ?? 0),
        products: prodRes.pagination?.total || (prodRes.data?.length ?? 0),
        users: Array.isArray(userRes.data) ? userRes.data.length : 0,
      });
    } catch (err) {
      console.error('Error loading workspace metrics:', err);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    fetchRealCounts();
  }, []);

  return (
    <div
      className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300"
      id="tenant-dashboard-container"
    >
      {/* Workspace Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 rounded uppercase tracking-wider">
              Active Workspace
            </span>
            <span className="text-[12px] text-gray-400 font-medium">
              ID: {tenant?.id || 'Unconfigured'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#111827] tracking-tight">
            {tenant ? tenant.legal_name : 'Workspace Directory'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Active Entity: {legalEntity?.legal_name || 'Primary'} • {branch?.branch_name || 'Main Branch'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRealCounts}
            className="p-2.5 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCcw className={`w-4 h-4 ${loadingCounts ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Base Currency</span>
            <span className="text-sm font-extrabold text-[#111827]">
              {tenant?.base_currency_code || 'INR'}
            </span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Timezone</span>
            <span className="text-sm font-extrabold text-[#111827]">{tenant?.timezone || 'UTC'}</span>
          </div>
        </div>
      </div>

      {/* Real Core Module Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customers Metric */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Customers
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#111827]">
              {loadingCounts ? '...' : counts.customers}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Registered Customer Accounts</p>
          </div>
          <Link
            to="/app/sales/customers"
            className="inline-flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800 pt-2 border-t border-gray-100"
          >
            <span>Manage Customers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Vendors Metric */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
              Vendors
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#111827]">
              {loadingCounts ? '...' : counts.vendors}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Supplier Directory Entries</p>
          </div>
          <Link
            to="/app/purchases/vendors"
            className="inline-flex items-center justify-between text-xs font-bold text-purple-600 hover:text-purple-800 pt-2 border-t border-gray-100"
          >
            <span>Manage Vendors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Products Metric */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Box className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Products
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#111827]">
              {loadingCounts ? '...' : counts.products}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Catalog Master Items</p>
          </div>
          <Link
            to="/app/inventory/products"
            className="inline-flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-800 pt-2 border-t border-gray-100"
          >
            <span>Manage Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Team Members Metric */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              Team
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#111827]">
              {loadingCounts ? '...' : counts.users}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Active Tenant Members</p>
          </div>
          <Link
            to="/app/team"
            className="inline-flex items-center justify-between text-xs font-bold text-amber-600 hover:text-amber-800 pt-2 border-t border-gray-100"
          >
            <span>Manage Team</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Quick Actions & Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/app/sales/customers"
            className="p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-start space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Customer Management</span>
              <span className="text-[11px] text-gray-500 font-normal">Add or update customers</span>
            </div>
          </Link>

          <Link
            to="/app/purchases/vendors"
            className="p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex flex-col items-start space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Vendor Management</span>
              <span className="text-[11px] text-gray-500 font-normal">Add or update suppliers</span>
            </div>
          </Link>

          <Link
            to="/app/inventory/products"
            className="p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex flex-col items-start space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Products Catalog</span>
              <span className="text-[11px] text-gray-500 font-normal">Manage catalog & inventory</span>
            </div>
          </Link>

          <Link
            to="/app/team"
            className="p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex flex-col items-start space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Team & Access</span>
              <span className="text-[11px] text-gray-500 font-normal">Invite users & manage roles</span>
            </div>
          </Link>

          <Link
            to="/app/settings"
            className="p-4 rounded-xl border border-gray-200 hover:border-slate-500 hover:bg-slate-50/50 transition-all flex flex-col items-start space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#111827] block">Tenant Settings</span>
              <span className="text-[11px] text-gray-500 font-normal">System preferences</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Operational Active Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Workspace Operational & Multi-Tenant Secured
            </h3>
            <p className="text-xs text-slate-300 font-normal mt-0.5">
              All 5 active core modules are connected directly to your tenant workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

