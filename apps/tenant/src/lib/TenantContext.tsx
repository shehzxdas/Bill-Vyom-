/**
 * Bill Vyom — Authoritative React Tenant Context & Context Switcher
 * Real-time header propagation and backend-verified authorization state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from './apiClient';
import {
  Tenant,
  LegalEntity,
  Branch,
  Warehouse,
  DashboardMetrics,
  TenantNotification,
} from '../../../../src/domain/types';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface TenantMembershipSummary {
  tenant_id: string;
  tenant_name: string;
  is_default: boolean;
}

interface TenantContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  tenant: Tenant | null;
  legalEntity: LegalEntity | null;
  branch: Branch | null;
  warehouse: Warehouse | null;
  legalEntities: LegalEntity[];
  branches: Branch[];
  warehouses: Warehouse[];
  memberships: TenantMembershipSummary[];
  roles: string[];
  metrics: DashboardMetrics | null;
  notifications: TenantNotification[];
  switchTenant: (tenantId: string) => Promise<void>;
  switchLegalEntity: (legalEntityId: string) => void;
  switchBranch: (branchId: string) => void;
  switchWarehouse: (warehouseId: string) => void;
  refreshContext: () => Promise<void>;
  logout: () => void;
}

const defaultTenantContext: TenantContextType = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  tenant: null,
  legalEntity: null,
  branch: null,
  warehouse: null,
  legalEntities: [],
  branches: [],
  warehouses: [],
  memberships: [],
  roles: [],
  metrics: null,
  notifications: [],
  switchTenant: async () => {},
  switchLegalEntity: () => {},
  switchBranch: () => {},
  switchWarehouse: () => {},
  refreshContext: async () => {},
  logout: () => {},
};

const TenantContext = createContext<TenantContextType>(defaultTenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [legalEntity, setLegalEntity] = useState<LegalEntity | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [memberships, setMemberships] = useState<TenantMembershipSummary[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);

  const fetchTenantContext = useCallback(async () => {
    setIsLoading(true);
    const meRes = await apiClient.get<{
      user: UserProfile;
      activeTenant: Tenant;
      memberships: TenantMembershipSummary[];
    }>('/auth/me');

    if (!meRes.success || !meRes.data) {
      setIsAuthenticated(false);
      setUser(null);
      setTenant(null);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setUser(meRes.data.user);
    setMemberships(meRes.data.memberships);

    // If active tenant ID isn't set in apiClient, set it
    if (meRes.data.activeTenant) {
      apiClient.setTenantContext({ tenantId: meRes.data.activeTenant.id });
    }

    // Get Full Context
    const ctxRes = await apiClient.get<{
      tenant: Tenant;
      activeContext: { legalEntity?: LegalEntity; branch?: Branch; warehouse?: Warehouse };
      legalEntities: LegalEntity[];
      branches: Branch[];
      warehouses: Warehouse[];
      roles: { role_code: string; role_name: string }[];
    }>('/tenant/context');

    if (ctxRes.success && ctxRes.data) {
      setTenant(ctxRes.data.tenant);
      setLegalEntities(ctxRes.data.legalEntities || []);
      setBranches(ctxRes.data.branches || []);
      setWarehouses(ctxRes.data.warehouses || []);
      setRoles((ctxRes.data.roles || []).map((r) => r.role_code));

      const activeLe = ctxRes.data.activeContext.legalEntity || ctxRes.data.legalEntities[0] || null;
      const activeBr = ctxRes.data.activeContext.branch || ctxRes.data.branches[0] || null;
      const activeWh = ctxRes.data.activeContext.warehouse || ctxRes.data.warehouses[0] || null;

      setLegalEntity(activeLe);
      setBranch(activeBr);
      setWarehouse(activeWh);

      apiClient.setTenantContext({
        legalEntityId: activeLe?.id || null,
        branchId: activeBr?.id || null,
        warehouseId: activeWh?.id || null,
      });
    }

    // Fetch Metrics
    const metricsRes = await apiClient.get<DashboardMetrics>('/tenant/dashboard');
    if (metricsRes.success && metricsRes.data) {
      setMetrics(metricsRes.data);
    }

    // Fetch Notifications
    const notifRes = await apiClient.get<TenantNotification[]>('/tenant/notifications');
    if (notifRes.success && notifRes.data) {
      setNotifications(notifRes.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTenantContext();
  }, [fetchTenantContext]);

  const switchTenant = async (tenantId: string) => {
    const res = await apiClient.post<{ token: string }>('/auth/switch-tenant', { tenant_id: tenantId });
    if (res.success && res.data?.token) {
      apiClient.setToken(res.data.token);
      apiClient.setTenantContext({ tenantId, legalEntityId: null, branchId: null, warehouseId: null });
      await fetchTenantContext();
    } else {
      console.error('Tenant switch unauthorized or failed on backend:', res.errors);
    }
  };

  const switchLegalEntity = (legalEntityId: string) => {
    const found = legalEntities.find((le) => le.id === legalEntityId) || null;
    setLegalEntity(found);
    const validBranches = branches.filter((b) => b.legal_entity_id === legalEntityId);
    const defaultBranch = validBranches[0] || null;
    setBranch(defaultBranch);

    const validWarehouses = warehouses.filter((w) => w.branch_id === defaultBranch?.id);
    const defaultWh = validWarehouses[0] || null;
    setWarehouse(defaultWh);

    apiClient.setTenantContext({
      legalEntityId,
      branchId: defaultBranch?.id || null,
      warehouseId: defaultWh?.id || null,
    });
  };

  const switchBranch = (branchId: string) => {
    const found = branches.find((b) => b.id === branchId) || null;
    setBranch(found);
    const validWarehouses = warehouses.filter((w) => w.branch_id === branchId);
    const defaultWh = validWarehouses[0] || null;
    setWarehouse(defaultWh);

    apiClient.setTenantContext({
      branchId,
      warehouseId: defaultWh?.id || null,
    });
  };

  const switchWarehouse = (warehouseId: string) => {
    const found = warehouses.find((w) => w.id === warehouseId) || null;
    setWarehouse(found);
    apiClient.setTenantContext({ warehouseId });
  };

  const logout = () => {
    apiClient.setToken(null);
    apiClient.setTenantContext({ tenantId: null, legalEntityId: null, branchId: null, warehouseId: null });
    setIsAuthenticated(false);
    setUser(null);
    setTenant(null);
    setLegalEntity(null);
    setBranch(null);
    setWarehouse(null);
  };

  return (
    <TenantContext.Provider
      value={{
        isAuthenticated,
        isLoading,
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
        metrics,
        notifications,
        switchTenant,
        switchLegalEntity,
        switchBranch,
        switchWarehouse,
        refreshContext: fetchTenantContext,
        logout,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  return context || defaultTenantContext;
};
