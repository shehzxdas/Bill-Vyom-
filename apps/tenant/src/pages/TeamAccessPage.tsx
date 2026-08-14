import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Globe,
  Building2,
  Lock,
  Plus,
  Edit,
  Trash2,
  Settings,
  Activity,
  Check,
  AlertCircle,
  Copy,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';

interface MemberItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  roles: string[];
  membership_status: string;
}

interface UserInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role_code: string;
  scope_type: 'TENANT' | 'LEGAL_ENTITY' | 'BRANCH' | 'OWN';
  scope_id: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

interface RoleItem {
  id: string;
  tenant_id: string;
  role_code: string;
  role_name: string;
  description: string;
  is_system: boolean;
  permission_ids?: string[];
  created_at: string;
}

interface PermissionItem {
  id: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
}

interface BusinessUnitItem {
  id: string;
  legal_entity_id: string | null;
  parent_business_unit_id: string | null;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export default function TeamAccessPage() {
  const { tenant, legalEntities, branches } = useTenant();
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'roles' | 'businessUnits'>('members');
  const [isLoading, setIsLoading] = useState(true);

  // Lists State
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitItem[]>([]);

  // Feedback notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleCode, setInviteRoleCode] = useState('STORE_MANAGER');
  const [inviteScopeType, setInviteScopeType] = useState<'TENANT' | 'LEGAL_ENTITY' | 'BRANCH' | 'OWN'>('TENANT');
  const [inviteScopeId, setInviteScopeId] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  // Role Form State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleCode, setRoleCode] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Manage User Roles Modal State
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [selectedMemberRoleIds, setSelectedMemberRoleIds] = useState<string[]>([]);

  // Business Unit Form State
  const [showBUModal, setShowBUModal] = useState(false);
  const [buName, setBuName] = useState('');
  const [buCode, setBuCode] = useState('');
  const [buLegalEntityId, setBuLegalEntityId] = useState('');
  const [buParentId, setBuParentId] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersRes, invitesRes, rolesRes, permsRes, buRes] = await Promise.all([
        apiClient.get<MemberItem[]>('/tenant/users'),
        apiClient.get<UserInvitation[]>('/tenant/invitations'),
        apiClient.get<RoleItem[]>('/tenant/roles'),
        apiClient.get<PermissionItem[]>('/tenant/permissions'),
        apiClient.get<BusinessUnitItem[]>('/tenant/business-units'),
      ]);

      if (membersRes.success && membersRes.data) setMembers(membersRes.data);
      if (invitesRes.success && invitesRes.data) setInvitations(invitesRes.data);
      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (permsRes.success && permsRes.data) setPermissions(permsRes.data);
      if (buRes.success && buRes.data) setBusinessUnits(buRes.data);
    } catch (err) {
      console.error('Error fetching IAM data:', err);
      showNotification('Failed to sync workspace configuration.', 'error');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Invite action
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await apiClient.post<{ invitation: UserInvitation; rawToken: string }>('/tenant/invitations', {
        email: inviteEmail,
        role_code: inviteRoleCode,
        scope_type: inviteScopeType,
        scope_id: inviteScopeId || null,
      });

      if (res.success && res.data) {
        // Build simulation onboarding link
        const currentUrl = window.location.origin;
        const link = `${currentUrl}/login?token=${res.data.rawToken}`;
        setGeneratedInviteLink(link);
        showNotification('Invitation generated and delivered successfully.');
        setInviteEmail('');
        fetchData();
      } else {
        showNotification(res.errors?.[0]?.message || 'Failed to trigger invitation.', 'error');
      }
    } catch (err) {
      showNotification('Service failure during invitation processing.', 'error');
    }
  };

  // Role form actions
  const handleOpenRoleModal = (role?: RoleItem) => {
    if (role) {
      setEditingRoleId(role.id);
      setRoleCode(role.role_code);
      setRoleName(role.role_name);
      setRoleDescription(role.description);
      setSelectedPermissionIds(role.permission_ids || []);
    } else {
      setEditingRoleId(null);
      setRoleCode('');
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissionIds([]);
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleCode || !roleName) return;

    try {
      let res;
      if (editingRoleId) {
        res = await apiClient.put<RoleItem>(`/tenant/roles/${editingRoleId}`, {
          role_name: roleName,
          description: roleDescription,
          permission_ids: selectedPermissionIds,
        });
      } else {
        res = await apiClient.post<RoleItem>('/tenant/roles', {
          role_code: roleCode,
          role_name: roleName,
          description: roleDescription,
          permission_ids: selectedPermissionIds,
        });
      }

      if (res.success) {
        showNotification(`Role ${editingRoleId ? 'updated' : 'created'} successfully.`);
        setShowRoleModal(false);
        fetchData();
      } else {
        showNotification(res.errors?.[0]?.message || 'Failed to save custom role.', 'error');
      }
    } catch (err) {
      showNotification('Failed to communicate with authorization repository.', 'error');
    }
  };

  // User Role Management
  const handleOpenUserRoleModal = (member: MemberItem) => {
    setSelectedMember(member);
    // Map current member role names/codes to database role IDs
    const matchedRoleIds = roles
      .filter((r) => member.roles.includes(r.role_code))
      .map((r) => r.id);
    setSelectedMemberRoleIds(matchedRoleIds);
    setShowUserRoleModal(true);
  };

  const handleSaveUserRoles = async () => {
    if (!selectedMember) return;
    try {
      // Loop through selected roles and assign
      // (Backend POST /tenant/users/:userId/roles takes role_id)
      for (const roleId of selectedMemberRoleIds) {
        await apiClient.post(`/tenant/users/${selectedMember.id}/roles`, { role_id: roleId });
      }
      showNotification('User authorization roles updated.');
      setShowUserRoleModal(false);
      fetchData();
    } catch (err) {
      showNotification('Error mapping user role assignment.', 'error');
    }
  };

  // Business Unit actions
  const handleSaveBU = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buName || !buCode) return;

    try {
      const res = await apiClient.post<BusinessUnitItem>('/tenant/business-units', {
        name: buName,
        code: buCode,
        legal_entity_id: buLegalEntityId || null,
        parent_business_unit_id: buParentId || null,
      });

      if (res.success) {
        showNotification('Business unit successfully provisioned.');
        setShowBUModal(false);
        setBuName('');
        setBuCode('');
        setBuLegalEntityId('');
        setBuParentId('');
        fetchData();
      } else {
        showNotification(res.errors?.[0]?.message || 'Failed to save business unit.', 'error');
      }
    } catch (err) {
      showNotification('Failed to register business unit in workspace ledger.', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Invitation link copied to clipboard!');
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Dynamic Feedback Notification banner */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 max-w-md animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 rounded uppercase tracking-wider">
              Identity & Access Management
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded uppercase tracking-wider">
              Phase 2 RBAC
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#111827] tracking-tight">Identity, Organization & Security</h1>
          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
            Configure Tenant Business Units, manage multi-channel invite tokens, design custom RBAC schemas, and map user authorization matrices.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'roles' && (
            <button
              onClick={() => handleOpenRoleModal()}
              className="bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          )}
          {activeTab === 'businessUnits' && (
            <button
              onClick={() => setShowBUModal(true)}
              className="bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Provision Business Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E5E7EB] gap-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-xs font-extrabold tracking-wide transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members & Roles Assignment</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 text-xs font-extrabold tracking-wide tracking-tight transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Invitation Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-xs font-extrabold tracking-wide transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
            activeTab === 'roles'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Custom RBAC & Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('businessUnits')}
          className={`px-4 py-2 text-xs font-extrabold tracking-wide transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
            activeTab === 'businessUnits'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Business Units & Nodes</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs font-bold text-gray-400">Syncing security and identity tables...</div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-extrabold text-[#111827]">Active Workspace Members ({members.length})</h2>
                  <p className="text-[11px] text-gray-400">Members authorized to log in and transact in this workspace context.</p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {members.map((m) => (
                  <div key={m.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-extrabold text-blue-800 text-xs shadow-sm uppercase">
                        {m.first_name[0] || m.email[0]}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-extrabold text-[#111827]">
                          {m.first_name} {m.last_name}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {m.roles.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-700 rounded border border-gray-200 uppercase tracking-tight">
                            {r}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                        {m.status}
                      </span>
                      <button
                        onClick={() => handleOpenUserRoleModal(m)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-extrabold flex items-center gap-1 pl-2 border-l border-gray-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Manage Roles</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: INVITATIONS ENGINE */}
          {activeTab === 'invitations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Form: Trigger Invitation */}
              <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#111827]">Generate Invite Token</h3>
                  <p className="text-[11px] text-gray-400">Trigger standard multi-channel rbac scopes.</p>
                </div>

                <form onSubmit={handleInvite} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Target Email Address *</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. engineer@corporation.com"
                      className="w-full p-2 border rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Assign Initial Role *</label>
                    <select
                      value={inviteRoleCode}
                      onChange={(e) => setInviteRoleCode(e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs font-medium bg-white"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.role_code}>
                          {r.role_name} ({r.role_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">RBAC Scope Definition *</label>
                    <select
                      value={inviteScopeType}
                      onChange={(e) => setInviteScopeType(e.target.value as any)}
                      className="w-full p-2 border rounded-lg text-xs font-medium bg-white"
                    >
                      <option value="TENANT">Tenant-Wide Isolation (Standard)</option>
                      <option value="LEGAL_ENTITY">Legal Entity Specific Isolation</option>
                      <option value="BRANCH">Branch Level Only Isolation</option>
                      <option value="OWN">Own Transactions Only</option>
                    </select>
                  </div>

                  {inviteScopeType === 'LEGAL_ENTITY' && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Select Legal Entity *</label>
                      <select
                        required
                        value={inviteScopeId}
                        onChange={(e) => setInviteScopeId(e.target.value)}
                        className="w-full p-2 border rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">-- Choose Legal Entity --</option>
                        {legalEntities.map((le) => (
                          <option key={le.id} value={le.id}>
                            {le.legal_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {inviteScopeType === 'BRANCH' && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Select Branch *</label>
                      <select
                        required
                        value={inviteScopeId}
                        onChange={(e) => setInviteScopeId(e.target.value)}
                        className="w-full p-2 border rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">-- Choose Branch --</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Generate Secure Invite</span>
                  </button>
                </form>

                {/* Simulated Delivery Panel */}
                {generatedInviteLink && (
                  <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Simulated Mail Server</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-normal">
                      Since email transmission is mocked in the preview env, copy the secure onboarding URL below to test invitation accept triggers.
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={generatedInviteLink}
                        className="flex-1 p-1.5 bg-white border border-emerald-200 rounded text-[9px] font-mono text-gray-600 outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(generatedInviteLink)}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 rounded flex items-center justify-center"
                        title="Copy Onboarding Token URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Invitations Ledger */}
              <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#111827]">Active Invitation Registry</h3>
                  <p className="text-[11px] text-gray-400">Cryptographically hashed invitation tokens and status trackers.</p>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {invitations.length === 0 ? (
                    <div className="p-8 text-center text-[11px] font-bold text-gray-400">No invitations triggered in this tenant yet.</div>
                  ) : (
                    invitations.map((inv) => (
                      <div key={inv.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-extrabold text-[#111827]">{inv.email}</span>
                            <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase border ${
                              inv.status === 'ACCEPTED'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : inv.status === 'PENDING'
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="flex gap-2 text-[10px] text-gray-400 font-medium">
                            <span>Role: <strong className="text-gray-500 font-bold uppercase">{inv.role_code}</strong></span>
                            <span>•</span>
                            <span>Scope: <strong className="text-gray-500 font-bold uppercase">{inv.scope_type}</strong></span>
                            {inv.accepted_at && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 font-bold">Joined: {new Date(inv.accepted_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-gray-400">Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM RBAC SCHEMAS */}
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: Role List & Compliance Checklist */}
              <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#111827]">Compliance Policy Guard</h3>
                  <p className="text-[11px] text-gray-400">Strict system boundaries & separation of duties rules.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold text-blue-900 leading-tight">Admin System Lock</h4>
                      <p className="text-[10px] text-blue-700 mt-0.5 leading-normal">
                        The role <code className="font-bold">ADMINISTRATOR</code> is a protected system entity. It bypasses authorization checks and cannot be modified or deleted.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-100 flex items-start gap-2.5">
                    <Activity className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold text-yellow-900 leading-tight">Separation of Duties Check</h4>
                      <p className="text-[10px] text-yellow-700 mt-0.5 leading-normal">
                        To maintain standard audit integrity, ensure roles with Ledger Posting rights do not contain Master Data Editing authorization.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold text-gray-900 leading-tight">Tenant Isolation Guarantee</h4>
                      <p className="text-[10px] text-gray-600 mt-0.5 leading-normal">
                        All customized permissions and security rules constructed on this dashboard are completely locked within the row-isolated boundary of {tenant?.legal_name}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Role Management Table */}
              <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#111827]">Workspace Roles Registry</h3>
                  <p className="text-[11px] text-gray-400">List of standard system and customized user roles inside this workspace.</p>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {roles.map((role) => (
                    <div key={role.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-extrabold text-gray-900">{role.role_name}</span>
                          <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase border ${
                            role.is_system
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          }`}>
                            {role.is_system ? 'System' : 'Custom'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium leading-normal max-w-md">{role.description || 'No description configured.'}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-gray-100 border border-gray-200 rounded text-gray-500 font-mono">
                            {role.role_code}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            ({role.permission_ids?.length || 0} permissions mapped)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!role.is_system && (
                          <button
                            onClick={() => handleOpenRoleModal(role)}
                            className="text-gray-500 hover:text-[#1E3A8A] p-1.5 border border-gray-200 rounded-lg hover:border-[#1E3A8A] transition-colors"
                            title="Edit Custom Role Mapping"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BUSINESS UNITS */}
          {activeTab === 'businessUnits' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: Contextual Guide */}
              <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#111827]">Business Node Hierarchy</h3>
                  <p className="text-[11px] text-gray-400">Establish structural relationships between legal entities and financial nodes.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5 text-xs text-gray-600 leading-normal">
                  <p>
                    <strong>Business Units (BUs)</strong> act as operational and financial reporting nodes within your tenant organization.
                  </p>
                  <p>
                    They can represent specific divisions (e.g. Retail Division, Corporate Procurement) or geographical sectors.
                  </p>
                  <p>
                    Each BU can optionally link directly to a <strong>Legal Entity</strong> or reference a parent unit node to formulate a clear multi-tiered consolidation hierarchy.
                  </p>
                </div>
              </div>

              {/* Right Panel: Business Unit Mapping List */}
              <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#111827]">Operational Business Units</h3>
                  <p className="text-[11px] text-gray-400">Configured operational sectors under {tenant?.legal_name}.</p>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {businessUnits.length === 0 ? (
                    <div className="p-12 text-center text-xs font-bold text-gray-400">No operational business units provisioned yet. Click "Provision Business Unit" to map your nodes.</div>
                  ) : (
                    businessUnits.map((bu) => {
                      const associatedLE = legalEntities.find((le) => le.id === bu.legal_entity_id);
                      const parentBU = businessUnits.find((p) => p.id === bu.parent_business_unit_id);

                      return (
                        <div key={bu.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-xs font-extrabold text-gray-900">{bu.name}</span>
                              <span className="px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-blue-50 border border-blue-200 text-blue-700 rounded uppercase">
                                {bu.code}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 text-[10px] text-gray-400 font-medium">
                              {associatedLE && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Legal Entity: <strong>{associatedLE.legal_name}</strong></span>
                                </span>
                              )}
                              {parentBU && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                  <span>Parent: <strong>{parentBU.name}</strong></span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                              {bu.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE OR EDIT CUSTOM ROLE */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-[#E5E7EB] flex flex-col max-h-[85vh] overflow-hidden">
            <div className="border-b border-gray-100 pb-3 mb-4 shrink-0">
              <h3 className="text-[16px] font-extrabold text-[#111827]">
                {editingRoleId ? 'Edit Customized RBAC Schema' : 'Create Custom RBAC Role'}
              </h3>
              <p className="text-[11px] text-gray-400">Map specialized business privileges to support custom rbac rules.</p>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Role Unique Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRoleId}
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. COMPLIANCE_OFFICER"
                    className="w-full p-2 border rounded-lg text-xs font-medium uppercase placeholder:normal-case focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Compliance Officer"
                    className="w-full p-2 border rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Brief Description</label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Summarize structural scope and access targets..."
                  className="w-full p-2 border rounded-lg text-xs font-medium h-16 outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Permission Matrix mapping */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-700 uppercase block mb-2 tracking-wide">
                  Privileges Mapping Matrix
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[30vh] overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  {permissions.map((perm) => {
                    const isChecked = selectedPermissionIds.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== perm.id));
                          } else {
                            setSelectedPermissionIds([...selectedPermissionIds, perm.id]);
                          }
                        }}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-3.5 h-3.5 text-[#1E3A8A] accent-[#1E3A8A] shrink-0 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-extrabold text-blue-900 font-mono uppercase bg-blue-100/60 px-1 rounded border border-blue-200">
                              {perm.action}:{perm.resource}
                            </span>
                            <span className="text-[8px] font-bold bg-gray-100 border border-gray-200 rounded text-gray-500 uppercase tracking-wider px-1">
                              {perm.module}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400 leading-normal block">
                            Grants authorization to execute {perm.action} action over {perm.resource} records.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
                >
                  {editingRoleId ? 'Save Changes' : 'Publish Custom Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN USER ROLES */}
      {showUserRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E5E7EB] space-y-4">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#111827]">Edit Member Privileges</h3>
              <p className="text-[11px] text-gray-400">Map customized role assignments for {selectedMember.first_name} {selectedMember.last_name}.</p>
            </div>

            <div className="space-y-2.5 max-h-[40vh] overflow-y-auto border border-gray-100 p-3 rounded-xl bg-gray-50/50">
              {roles.map((r) => {
                const isSelected = selectedMemberRoleIds.includes(r.id);

                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMemberRoleIds(selectedMemberRoleIds.filter((id) => id !== r.id));
                      } else {
                        setSelectedMemberRoleIds([...selectedMemberRoleIds, r.id]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-3.5 h-3.5 text-[#1E3A8A] accent-[#1E3A8A] shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-extrabold text-[#111827]">{r.role_name}</span>
                        <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded uppercase border ${
                          r.is_system ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                          {r.is_system ? 'System' : 'Custom'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 leading-normal block">
                        {r.description || 'Allows standard authorizations mapped inside this role code.'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowUserRoleModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserRoles}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
              >
                Save Role Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PROVISION BUSINESS UNIT */}
      {showBUModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E5E7EB] space-y-4">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#111827]">Provision Operational Business Unit</h3>
              <p className="text-[11px] text-gray-400">Add operational nodes to support structured organizational hierarchy mapping.</p>
            </div>

            <form onSubmit={handleSaveBU} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Business Unit Name *</label>
                <input
                  type="text"
                  required
                  value={buName}
                  onChange={(e) => setBuName(e.target.value)}
                  placeholder="e.g. Retail Division East"
                  className="w-full p-2 border rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Unique Code (Reference Ledger) *</label>
                <input
                  type="text"
                  required
                  value={buCode}
                  onChange={(e) => setBuCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. RET-DIV-EAST"
                  className="w-full p-2 border rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Associated Legal Entity</label>
                <select
                  value={buLegalEntityId}
                  onChange={(e) => setBuLegalEntityId(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs font-medium bg-white"
                >
                  <option value="">-- No Direct Link --</option>
                  {legalEntities.map((le) => (
                    <option key={le.id} value={le.id}>
                      {le.legal_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Parent Business Unit (Hierarchy Node)</label>
                <select
                  value={buParentId}
                  onChange={(e) => setBuParentId(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs font-medium bg-white"
                >
                  <option value="">-- Root Level Node --</option>
                  {businessUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>
                      {bu.name} ({bu.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBUModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
