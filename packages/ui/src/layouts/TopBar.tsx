import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  UserSquare2,
  Building2,
  Store,
  LogOut,
  X,
  Check,
} from 'lucide-react';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';
import { apiClient } from '../../../../apps/tenant/src/lib/apiClient';

export default function TopBar({ isAdmin }: { isAdmin: boolean }) {
  const {
    isAuthenticated,
    user,
    tenant,
    legalEntity,
    branch,
    warehouse,
    legalEntities,
    branches,
    warehouses,
    memberships,
    roles,
    notifications,
    switchTenant,
    switchLegalEntity,
    switchBranch,
    switchWarehouse,
    refreshContext,
    logout,
  } = useTenant();

  // Dropdown UI states
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<
    'BRANCH' | 'ENTITY' | 'WAREHOUSE' | 'INVITE' | null
  >(null);
  const [modalInput, setModalInput] = useState({
    name: '',
    code: '',
    email: '',
    firstName: '',
    lastName: '',
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { type: string; title: string; subtitle: string; id: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const res = await apiClient.get<{
      results: { type: string; title: string; subtitle: string; id: string }[];
    }>(`/tenant/search?q=${encodeURIComponent(query)}`);
    if (res.success && res.data) {
      setSearchResults(res.data.results);
    } else {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleCreateBranch = async () => {
    if (!tenant || !legalEntity || !modalInput.name || !modalInput.code) return;
    await apiClient.post('/tenant/branches', {
      legal_entity_id: legalEntity.id,
      branch_code: modalInput.code,
      branch_name: modalInput.name,
      country_code: tenant.country_code,
    });
    setModalInput({ name: '', code: '', email: '', firstName: '', lastName: '' });
    setActiveModal(null);
    refreshContext();
  };

  const handleCreateLegalEntity = async () => {
    if (!tenant || !modalInput.name || !modalInput.code) return;
    await apiClient.post('/tenant/legal-entities', {
      entity_code: modalInput.code,
      legal_name: modalInput.name,
      country_code: tenant.country_code,
    });
    setModalInput({ name: '', code: '', email: '', firstName: '', lastName: '' });
    setActiveModal(null);
    refreshContext();
  };

  const handleCreateWarehouse = async () => {
    if (!tenant || !branch || !modalInput.name || !modalInput.code) return;
    await apiClient.post('/tenant/warehouses', {
      branch_id: branch.id,
      warehouse_code: modalInput.code,
      warehouse_name: modalInput.name,
    });
    setModalInput({ name: '', code: '', email: '', firstName: '', lastName: '' });
    setActiveModal(null);
    refreshContext();
  };

  const handleInviteUser = async () => {
    if (!tenant || !modalInput.email) return;
    await apiClient.post('/tenant/users/invite', {
      email: modalInput.email,
      first_name: modalInput.firstName || 'Team',
      last_name: modalInput.lastName || 'Member',
      role_code: 'STORE_MANAGER',
    });
    setModalInput({ name: '', code: '', email: '', firstName: '', lastName: '' });
    setActiveModal(null);
    refreshContext();
  };

  return (
    <header className="h-[60px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0 flex-shrink-0">
      <div className="flex items-center gap-4 flex-1">
        {/* Business Context Switcher (Tenant Only) */}
        {!isAdmin && (
          <div className="hidden lg:flex items-center gap-2">
            {/* Tenant Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTenantDropdown(!showTenantDropdown);
                  setShowContextDropdown(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="w-5 h-5 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex flex-col text-left -space-y-0.5 max-w-[130px]">
                  <span className="text-[12px] font-bold text-[#111827] truncate">
                    {tenant ? tenant.legal_name : 'Not configured'}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                    Tenant
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>

              {showTenantDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-1">
                    Switch Tenant Workspace
                  </div>
                  {memberships.length > 0 ? (
                    memberships.map((m) => (
                      <button
                        key={m.tenant_id}
                        onClick={() => {
                          switchTenant(m.tenant_id);
                          setShowTenantDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] font-semibold flex items-center justify-between hover:bg-blue-50 transition-colors ${
                          tenant?.id === m.tenant_id ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'
                        }`}
                      >
                        <span className="truncate">{m.tenant_name}</span>
                        {tenant?.id === m.tenant_id && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[11px] text-gray-400">No other tenant workspaces</div>
                  )}
                </div>
              )}
            </div>

            {/* Legal Entity & Branch Context Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowContextDropdown(!showContextDropdown);
                  setShowTenantDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E7EB] rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="w-5 h-5 rounded bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <Store className="w-3 h-3 text-purple-600" />
                </div>
                <div className="flex flex-col text-left -space-y-0.5 max-w-[140px]">
                  <span className="text-[12px] font-bold text-[#111827] truncate">
                    {branch ? branch.branch_name : 'No Branch'}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                    {legalEntity ? legalEntity.legal_name : 'Not configured'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>

              {showContextDropdown && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-3 z-50 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Legal Entity Scope
                    </label>
                    <select
                      value={legalEntity?.id || ''}
                      onChange={(e) => switchLegalEntity(e.target.value)}
                      className="w-full text-[12px] font-semibold border border-[#E5E7EB] rounded-lg p-1.5 bg-[#F8FAFC]"
                    >
                      {legalEntities.map((le) => (
                        <option key={le.id} value={le.id}>
                          {le.legal_name} ({le.entity_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Branch Scope
                    </label>
                    <select
                      value={branch?.id || ''}
                      onChange={(e) => switchBranch(e.target.value)}
                      className="w-full text-[12px] font-semibold border border-[#E5E7EB] rounded-lg p-1.5 bg-[#F8FAFC]"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name} ({b.branch_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Warehouse Scope
                    </label>
                    <select
                      value={warehouse?.id || ''}
                      onChange={(e) => switchWarehouse(e.target.value)}
                      className="w-full text-[12px] font-semibold border border-[#E5E7EB] rounded-lg p-1.5 bg-[#F8FAFC]"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.warehouse_name} ({wh.warehouse_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Search */}
        <div className="relative flex-1 max-w-xl mx-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search branches, legal entities, warehouses, users..."
              className="w-full pl-9 pr-12 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] focus:bg-white transition-all font-medium placeholder:text-gray-400 shadow-sm"
            />
          </div>

          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-2 z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-[12px] text-gray-400 font-medium">Searching tenant index...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div key={item.id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#111827]">{item.title}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">{item.subtitle}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-[12px] text-gray-400 font-medium">No results found in tenant context</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Actions (Tenant Only) */}
        {!isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-1.5 bg-[#1E3A8A] hover:bg-[#152e73] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-[12px] shadow-sm tracking-wide"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Action</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {showQuickActions && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-xl py-2 z-50">
                <button
                  onClick={() => {
                    setActiveModal('BRANCH');
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  + Add Branch
                </button>
                <button
                  onClick={() => {
                    setActiveModal('ENTITY');
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  + Add Legal Entity
                </button>
                <button
                  onClick={() => {
                    setActiveModal('WAREHOUSE');
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  + Add Warehouse
                </button>
                <button
                  onClick={() => {
                    setActiveModal('INVITE');
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                >
                  + Invite Team Member
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications Icon & Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-md"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-[13px] font-bold text-[#111827]">System Notifications</span>
                <span className="text-[10px] text-gray-400">{notifications.length} Unread</span>
              </div>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="p-2 bg-gray-50 rounded-lg mb-2 text-[12px]">
                    <div className="font-bold text-gray-800">{n.title}</div>
                    <div className="text-gray-500">{n.message}</div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[12px] text-gray-400 font-medium">
                  No system notifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">
              {user ? user.first_name[0] : <UserSquare2 className="w-4 h-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left -space-y-0.5">
              <span className="text-[12px] font-bold text-[#111827]">
                {user ? `${user.first_name} ${user.last_name}` : 'Sign In'}
              </span>
              <span className="text-[10px] font-semibold text-gray-400">
                {roles[0] || 'Member'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute top-full right-0 mt-1 w-60 bg-white border border-[#E5E7EB] rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[12px] font-bold text-gray-900">
                  {user ? `${user.first_name} ${user.last_name}` : 'Not Signed In'}
                </p>
                <p className="text-[11px] text-gray-400">{user?.email || ''}</p>
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTION MODALS */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E5E7EB] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[15px] font-extrabold text-[#111827]">
                {activeModal === 'BRANCH' && 'Create New Branch'}
                {activeModal === 'ENTITY' && 'Create Legal Entity'}
                {activeModal === 'WAREHOUSE' && 'Create Warehouse'}
                {activeModal === 'INVITE' && 'Invite Team Member'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModal === 'INVITE' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={modalInput.email}
                    onChange={(e) => setModalInput({ ...modalInput, email: e.target.value })}
                    placeholder="user@company.com"
                    className="w-full p-2 border rounded-lg text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">First Name</label>
                    <input
                      type="text"
                      value={modalInput.firstName}
                      onChange={(e) => setModalInput({ ...modalInput, firstName: e.target.value })}
                      className="w-full p-2 border rounded-lg text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={modalInput.lastName}
                      onChange={(e) => setModalInput({ ...modalInput, lastName: e.target.value })}
                      className="w-full p-2 border rounded-lg text-[13px]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Name</label>
                  <input
                    type="text"
                    value={modalInput.name}
                    onChange={(e) => setModalInput({ ...modalInput, name: e.target.value })}
                    placeholder="e.g. Regional Logistics Hub"
                    className="w-full p-2 border rounded-lg text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Code</label>
                  <input
                    type="text"
                    value={modalInput.code}
                    onChange={(e) => setModalInput({ ...modalInput, code: e.target.value })}
                    placeholder="e.g. BR-002"
                    className="w-full p-2 border rounded-lg text-[13px]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[12px] font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeModal === 'BRANCH') handleCreateBranch();
                  if (activeModal === 'ENTITY') handleCreateLegalEntity();
                  if (activeModal === 'WAREHOUSE') handleCreateWarehouse();
                  if (activeModal === 'INVITE') handleInviteUser();
                }}
                className="px-4 py-2 text-[12px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-sm"
              >
                Save Entity
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
