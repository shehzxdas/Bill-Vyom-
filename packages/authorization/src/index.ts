/**
 * Bill Vyom — Authoritative RBAC & Permission System
 * Enforces highly granular user access control, action validation, and security safeguards.
 */

import { Role, Permission } from '@packages/domain/src/types';

export const SYSTEM_PERMISSIONS = {
  TENANT_VIEW: 'perm_org_view',
  TENANT_EDIT: 'perm_org_edit',
  LEGAL_ENTITY_VIEW: 'perm_entity_view',
  LEGAL_ENTITY_CREATE: 'perm_entity_create',
  BRANCH_VIEW: 'perm_branch_view',
  BRANCH_CREATE: 'perm_branch_create',
  WAREHOUSE_VIEW: 'perm_wh_view',
  WAREHOUSE_CREATE: 'perm_wh_create',
  TEAM_VIEW: 'perm_team_view',
  TEAM_INVITE: 'perm_team_invite',
  SETTINGS_VIEW: 'perm_settings_view',
  SETTINGS_EDIT: 'perm_settings_edit',
  DASHBOARD_VIEW: 'perm_dashboard_view',
  
  // Master Data
  PRODUCT_VIEW: 'perm_product_view',
  PRODUCT_CREATE: 'perm_product_create',
  PRODUCT_EDIT: 'perm_product_edit',
  PRODUCT_ARCHIVE: 'perm_product_archive',
  CUSTOMER_VIEW: 'perm_customer_view',
  CUSTOMER_CREATE: 'perm_customer_create',
  CUSTOMER_EDIT: 'perm_customer_edit',
  CUSTOMER_ARCHIVE: 'perm_customer_archive',
  VENDOR_VIEW: 'perm_vendor_view',
  VENDOR_CREATE: 'perm_vendor_create',
  VENDOR_EDIT: 'perm_vendor_edit',
  VENDOR_ARCHIVE: 'perm_vendor_archive',
  MASTER_CONFIG: 'perm_master_config',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'], // Super user scope
  FINANCE_MANAGER: [
    SYSTEM_PERMISSIONS.TENANT_VIEW,
    SYSTEM_PERMISSIONS.LEGAL_ENTITY_VIEW,
    SYSTEM_PERMISSIONS.BRANCH_VIEW,
    SYSTEM_PERMISSIONS.WAREHOUSE_VIEW,
    SYSTEM_PERMISSIONS.TEAM_VIEW,
    SYSTEM_PERMISSIONS.SETTINGS_VIEW,
    SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
    SYSTEM_PERMISSIONS.PRODUCT_VIEW,
    SYSTEM_PERMISSIONS.CUSTOMER_VIEW,
    SYSTEM_PERMISSIONS.VENDOR_VIEW,
  ],
  STORE_MANAGER: [
    SYSTEM_PERMISSIONS.TENANT_VIEW,
    SYSTEM_PERMISSIONS.BRANCH_VIEW,
    SYSTEM_PERMISSIONS.WAREHOUSE_VIEW,
    SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
    SYSTEM_PERMISSIONS.PRODUCT_VIEW,
    SYSTEM_PERMISSIONS.PRODUCT_CREATE,
    SYSTEM_PERMISSIONS.PRODUCT_EDIT,
  ],
  ACCOUNTANT: [
    SYSTEM_PERMISSIONS.TENANT_VIEW,
    SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
    SYSTEM_PERMISSIONS.PRODUCT_VIEW,
    SYSTEM_PERMISSIONS.CUSTOMER_VIEW,
    SYSTEM_PERMISSIONS.VENDOR_VIEW,
  ],
  CASHIER: [
    SYSTEM_PERMISSIONS.TENANT_VIEW,
    SYSTEM_PERMISSIONS.PRODUCT_VIEW,
  ]
};

/**
 * Checks if a set of roles has access to a specific permission code.
 */
export function hasPermission(userRoles: string[], permissionCode: string): boolean {
  if (userRoles.includes('OWNER')) {
    return true; // OWNER bypasses all checks
  }

  for (const role of userRoles) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (permissions.includes('*') || permissions.includes(permissionCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate that a request scope has permission.
 */
export function validateScope(userScopes: string[], requiredScope: string): boolean {
  if (userScopes.includes('*')) return true;
  return userScopes.includes(requiredScope);
}
