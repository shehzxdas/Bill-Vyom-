/**
 * Bill Vyom — Security, Authentication & OIDC JWT Engine
 * Real backend-enforced authentication with zero fake success.
 */

import crypto from 'crypto';
import { User, Tenant, TenantMembership, Role, LegalEntity, Branch, Warehouse } from '../domain/types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'bill_vyom_production_secret_key_2026_hyperscale';

export interface TokenPayload {
  sub: string; // user_id
  email: string;
  tenant_id: string;
  roles: string[];
  scopes: string[];
  exp: number;
  iat: number;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_bv_salt').digest('hex');
}

export function signJwt(payload: Omit<TokenPayload, 'exp' | 'iat'>, expiresInSeconds = 900): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  const fullPayload: TokenPayload = {
    ...payload,
    iat,
    exp,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Onboard a brand new Tenant, default Owner User, Legal Entity, and Branch
 */
export function onboardTenant(params: {
  legal_name: string;
  trade_name?: string;
  country_code: string;
  base_currency_code: string;
  timezone: string;
  business_type: string;
  industry: string;
  contact_email: string;
  contact_phone: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_password: string;
}): { tenant: Tenant; user: User; legalEntity: LegalEntity; branch: Branch; token: string } {
  const now = new Date().toISOString();
  const tenantId = `tn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const legalEntityId = `le_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const branchId = `br_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const warehouseId = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const roleId = `role_owner_${tenantId}`;

  // 1. Create Tenant
  const tenant: Tenant = {
    id: tenantId,
    legal_name: params.legal_name,
    trade_name: params.trade_name || params.legal_name,
    country_code: params.country_code,
    base_currency_code: params.base_currency_code,
    timezone: params.timezone,
    business_type: params.business_type,
    industry: params.industry,
    status: 'ACTIVE',
    address: {
      street_address: 'Not configured',
      city: 'Not configured',
      state_province: 'Not configured',
      postal_code: 'Not configured',
      country_code: params.country_code,
    },
    contact_email: params.contact_email,
    contact_phone: params.contact_phone,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
    deleted_at: null,
    version: 1,
  };
  db.tenants.set(tenantId, tenant);

  // 2. Create User
  const user: User = {
    id: userId,
    email: params.owner_email.toLowerCase(),
    password_hash: hashPassword(params.owner_password),
    first_name: params.owner_first_name,
    last_name: params.owner_last_name,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
  };
  db.users.set(userId, user);

  // 3. Create Tenant Membership
  const membership: TenantMembership = {
    id: `mem_${tenantId}_${userId}`,
    user_id: userId,
    tenant_id: tenantId,
    status: 'ACTIVE',
    is_default: true,
    created_at: now,
    updated_at: now,
  };
  db.memberships.set(membership.id, membership);

  // 4. Create Owner Role
  const role: Role = {
    id: roleId,
    tenant_id: tenantId,
    role_code: 'OWNER',
    role_name: 'Tenant Owner',
    description: 'Full administrative access across all tenant resources.',
    is_system: true,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
    deleted_at: null,
    version: 1,
  };
  db.roles.set(roleId, role);

  // 5. Assign Owner Role
  db.userRoleAssignments.set(`ura_${userId}_${roleId}`, {
    id: `ura_${userId}_${roleId}`,
    tenant_id: tenantId,
    user_id: userId,
    role_id: roleId,
  });

  // 6. Create Default Legal Entity
  const legalEntity: LegalEntity = {
    id: legalEntityId,
    tenant_id: tenantId,
    entity_code: 'LE-001',
    legal_name: params.legal_name,
    country_code: params.country_code,
    currency_code: params.base_currency_code,
    timezone: params.timezone,
    jurisdiction_code: params.country_code,
    tax_registrations: [],
    fiscal_start_month: 1,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
    deleted_at: null,
    version: 1,
  };
  db.legalEntities.set(legalEntityId, legalEntity);

  // 7. Create Primary Branch
  const branch: Branch = {
    id: branchId,
    tenant_id: tenantId,
    legal_entity_id: legalEntityId,
    branch_code: 'HO-001',
    branch_name: 'Head Office',
    country_code: params.country_code,
    timezone: params.timezone,
    currency_code: params.base_currency_code,
    address: {
      street_address: 'Not configured',
      city: 'Not configured',
      state_province: 'Not configured',
      postal_code: 'Not configured',
      country_code: params.country_code,
    },
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
    deleted_at: null,
    version: 1,
  };
  db.branches.set(branchId, branch);

  // 8. Create Primary Warehouse
  const warehouse: Warehouse = {
    id: warehouseId,
    tenant_id: tenantId,
    branch_id: branchId,
    warehouse_code: 'WH-MAIN',
    warehouse_name: 'Main Warehouse',
    address: branch.address,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
    deleted_at: null,
    version: 1,
  };
  db.warehouses.set(warehouseId, warehouse);

  // 9. Create Default Settings
  db.settings.set(tenantId, {
    tenant_id: tenantId,
    business: {
      trade_name: params.trade_name || params.legal_name,
      legal_name: params.legal_name,
      industry: params.industry,
      business_type: params.business_type,
      timezone: params.timezone,
      base_currency: params.base_currency_code,
    },
    localization: {
      date_format: 'YYYY-MM-DD',
      time_format: '24h',
      number_format: 'STANDARD',
    },
    numbering_sequences: [
      { prefix: 'INV-', next_number: 1001, document_type: 'INVOICE' },
      { prefix: 'PO-', next_number: 1001, document_type: 'PURCHASE_ORDER' },
    ],
    notifications: {
      email_alerts: true,
      approval_reminders: true,
    },
    security: {
      session_timeout_minutes: 15,
      mfa_required: false,
    },
  });

  // 10. Record Audit Log
  db.recordAuditLog({
    tenant_id: tenantId,
    actor_id: userId,
    actor_email: user.email,
    action: 'TENANT.ONBOARDED',
    resource_type: 'tenant',
    resource_id: tenantId,
    changes: { legal_name: params.legal_name, country_code: params.country_code },
  });

  const token = signJwt({
    sub: userId,
    email: user.email,
    tenant_id: tenantId,
    roles: ['OWNER'],
    scopes: ['*'],
  });

  return { tenant, user, legalEntity, branch, token };
}
