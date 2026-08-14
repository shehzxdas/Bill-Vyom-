import React, { useState } from 'react';
import {
  Building2,
  LayoutDashboard,
  Receipt,
  Box,
  IndianRupee,
  Calculator,
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  FileText,
  FileBox,
  Truck,
  RotateCcw,
  Tags,
  Store,
  Layers,
  Building,
  Archive,
  RefreshCw,
  Wallet,
  Clock,
  Briefcase,
  MonitorSmartphone,
  PhoneCall,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Activity,
  PieChart,
  AlertTriangle,
  AlertCircle,
  Key,
  MapPin,
  LifeBuoy,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const activePhase1Routes = ['/app', '/app/team', '/app/settings', '/app/organization'];

const tenantStructure = [
  {
    title: 'CORE MODULES',
    items: [
      { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
      { name: 'Point of Sale (POS)', href: '/app/pos', icon: Store },
      { name: 'Sales & Commercials', href: '/app/sales', icon: Receipt },
      { name: 'Accounts Receivable', href: '/app/receivables', icon: IndianRupee },
      { name: 'Procurement', href: '/app/procurement', icon: ShoppingCart },
      { name: 'Accounts Payable', href: '/app/payables', icon: CreditCard },
      { name: 'Global Inventory', href: '/app/inventory', icon: Layers },
      { name: 'Accounting', href: '/app/accounting', icon: Calculator },
      { name: 'Customers', href: '/app/sales/customers', icon: Users },
      { name: 'Vendors', href: '/app/purchases/vendors', icon: Building },
      { name: 'Products', href: '/app/inventory/products', icon: Box },
      { name: 'Team & Access', href: '/app/team', icon: UserCheck },
      { name: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
];

const adminStructure = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'TENANT MANAGEMENT',
    items: [
      { name: 'All Users & Tenants', href: '/admin/users', icon: Building2 },
    ],
  },
];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const structure = isAdmin ? adminStructure : tenantStructure;

  return (
    <div
      className={`${
        collapsed ? 'w-[70px]' : 'w-[240px]'
      } bg-[#F8FAFC] border-r border-[#E5E7EB] flex flex-col flex-shrink-0 hidden md:flex transition-all duration-300 z-10`}
    >
      {/* Brand */}
      <div className="h-[60px] flex items-center px-4 border-b border-[#E5E7EB] bg-white flex-shrink-0 justify-between">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 bg-[#1E3A8A] rounded-[6px] shadow-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs tracking-tighter">B</span>
          </div>
          {!collapsed && (
            <span className="text-[16px] font-bold tracking-tight text-[#111827] truncate">
              BillVyom OS
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 sidebar-scroll">
        {structure.map((section, idx) => (
          <div key={idx}>
            {section.title && !collapsed && (
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 pl-3">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg font-medium transition-colors group ${
                      isActive
                        ? 'bg-[#1E3A8A] text-white shadow-sm'
                        : 'text-gray-600 hover:text-[#111827] hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <link.icon
                        className={`w-[15px] h-[15px] shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#111827]'
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {!collapsed && <span className="text-[12.5px] truncate">{link.name}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse button block */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 border-t border-[#E5E7EB] flex items-center px-4 shrink-0 hover:bg-gray-50 cursor-pointer text-gray-500 font-medium text-[12px] gap-2"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        {!collapsed && <span>Collapse Sidebar</span>}
      </button>
    </div>
  );
}
