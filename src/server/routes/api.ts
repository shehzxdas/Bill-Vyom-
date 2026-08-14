/**
 * Bill Vyom — Authoritative Tenant API Gateway Routes
 * All requests enforce tenant isolation, contract validation, and audit trail records.
 */

import { Router, Response } from 'express';
import { onboardTenant, hashPassword, signJwt, verifyJwt } from '../auth';
import { db } from '../db';
import { tenantResolver, AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';
import { masterDataRouter } from './masterDataApi';
import { accountingRouter } from './accountingApi';
import { salesRouter } from './salesApi';
import { receivablesRouter } from './receivablesApi';
import { procurementRouter } from './procurementApi';
import { payablesRouter } from './payablesApi';
import { inventoryRouter } from './inventoryApi';
import { posRouter } from './posApi';
import { taxRouter } from './taxApi';
import { complianceRouter } from './complianceApi';
import { LegalEntity, Branch, Warehouse, TenantMembership, BusinessUnit, UserInvitation, Role } from '../../domain/types';

export const apiRouter = Router();

// ==========================================
// 1. PUBLIC AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/v1/auth/onboard
 * Onboards a brand new production tenant with its initial legal entity and owner.
 */
apiRouter.post('/auth/onboard', (req, res) => {
  try {
    const {
      legal_name,
      trade_name,
      country_code,
      base_currency_code,
      timezone,
      business_type,
      industry,
      contact_email,
      contact_phone,
      owner_first_name,
      owner_last_name,
      owner_email,
      owner_password,
    } = req.body;

    if (!legal_name || !country_code || !base_currency_code || !owner_email || !owner_password) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Required organization or owner credentials missing.' }],
      });
    }

    // Check if user email already exists
    const existingUser = Array.from(db.users.values()).find(
      (u) => u.email === owner_email.toLowerCase()
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_EMAIL_EXISTS', message: 'An account with this email address already exists.' }],
      });
    }

    const result = onboardTenant({
      legal_name,
      trade_name,
      country_code,
      base_currency_code,
      timezone: timezone || 'UTC',
      business_type: business_type || 'Private Limited',
      industry: industry || 'Technology',
      contact_email: contact_email || owner_email,
      contact_phone: contact_phone || '',
      owner_first_name,
      owner_last_name,
      owner_email,
      owner_password,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: {
        token: result.token,
        tenant: result.tenant,
        user: {
          id: result.user.id,
          email: result.user.email,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
        },
        legalEntity: result.legalEntity,
        branch: result.branch,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INTERNAL_ERROR', message: (err as Error).message }],
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Real password verification against database. Zero fake login.
 */
apiRouter.post('/auth/login', (req, res) => {
  const { email, password, tenant_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_CREDENTIALS_REQUIRED', message: 'Email and password are required.' }],
    });
  }

  const user = Array.from(db.users.values()).find((u) => u.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INVALID_CREDENTIALS', message: 'Invalid email or password.' }],
    });
  }

  const inputHash = hashPassword(password);
  if (user.password_hash !== inputHash) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INVALID_CREDENTIALS', message: 'Invalid email or password.' }],
    });
  }

  // Get user memberships
  const memberships = db.getMembershipsByUser(user.id);
  if (memberships.length === 0) {
    return res.status(403).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_NO_TENANT_MEMBERSHIP', message: 'User is not assigned to any active tenant workspace.' }],
    });
  }

  // Determine target tenant
  const targetMembership = tenant_id
    ? memberships.find((m) => m.tenant_id === tenant_id)
    : memberships.find((m) => m.is_default) || memberships[0];

  if (!targetMembership) {
    return res.status(403).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_TENANT_ACCESS_DENIED', message: 'User does not belong to the requested tenant.' }],
    });
  }

  const targetTenant = db.getTenant(targetMembership.tenant_id)!;
  const userRoles = db.getUsersByTenant(targetTenant.id).find((u) => u.user.id === user.id)?.roles || [];

  const token = signJwt({
    sub: user.id,
    email: user.email,
    tenant_id: targetTenant.id,
    roles: userRoles.map((r) => r.role_code),
    scopes: ['*'],
  });

  db.recordAuditLog({
    tenant_id: targetTenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'AUTH.LOGIN',
    resource_type: 'user',
    resource_id: user.id,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      activeTenant: targetTenant,
      memberships: memberships.map((m) => ({
        tenant_id: m.tenant_id,
        tenant_name: db.getTenant(m.tenant_id)?.legal_name || 'Tenant Workspace',
        is_default: m.is_default,
      })),
    },
  });
});

/**
 * GET /api/v1/auth/me
 */
apiRouter.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_UNAUTHORIZED', message: 'Authentication required.' }],
    });
  }

  const payload = verifyJwt(authHeader.substring(7));
  if (!payload) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INVALID_TOKEN', message: 'Invalid or expired token.' }],
    });
  }

  const user = db.users.get(payload.sub);
  if (!user) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_USER_NOT_FOUND', message: 'User account not found.' }],
    });
  }

  const memberships = db.getMembershipsByUser(user.id).map((m) => ({
    tenant_id: m.tenant_id,
    tenant_name: db.getTenant(m.tenant_id)?.legal_name || 'Tenant Workspace',
    is_default: m.is_default,
  }));

  const activeTenant = db.getTenant(payload.tenant_id);

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      activeTenant,
      memberships,
    },
  });
});

/**
 * POST /api/v1/auth/switch-tenant
 * Switches active tenant context, issuing a new JWT if access is authorized.
 */
apiRouter.post('/auth/switch-tenant', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_UNAUTHORIZED', message: 'Authentication required.' }],
    });
  }

  const payload = verifyJwt(authHeader.substring(7));
  if (!payload) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INVALID_TOKEN', message: 'Invalid or expired token.' }],
    });
  }

  const { tenant_id } = req.body;
  if (!tenant_id) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'target tenant_id is required.' }],
    });
  }

  // Enforce boundary check: does the user have access to the target tenant?
  const membership = db.getMembership(payload.sub, tenant_id);
  if (!membership) {
    return res.status(403).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_TENANT_ACCESS_DENIED', message: 'You do not have active membership in the target tenant.' }],
    });
  }

  const targetTenant = db.getTenant(tenant_id);
  if (!targetTenant || targetTenant.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_TENANT_INACTIVE', message: 'The selected tenant workspace is inactive.' }],
    });
  }

  const user = db.users.get(payload.sub)!;
  const userRoles = db.getUsersByTenant(tenant_id).find((u) => u.user.id === user.id)?.roles || [];

  const token = signJwt({
    sub: user.id,
    email: user.email,
    tenant_id: targetTenant.id,
    roles: userRoles.map((r) => r.role_code),
    scopes: ['*'],
  });

  db.recordAuditLog({
    tenant_id: targetTenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'AUTH.SWITCH_TENANT',
    resource_type: 'tenant',
    resource_id: targetTenant.id,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      activeTenant: targetTenant,
    },
  });
});

/**
 * POST /api/v1/auth/invitations/accept
 * Accepts a user invitation, creating a user and joining the tenant.
 */
apiRouter.post('/auth/invitations/accept', (req, res) => {
  const { token, password, first_name, last_name } = req.body;

  if (!token || !password || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Token, password, first name, and last name are required.' }],
    });
  }

  // Find invitation by token (hash the incoming token to match storage)
  const tokenHash = hashPassword(token);
  const invitation = Array.from(db.invitations.values()).find(
    (inv) => inv.token_hash === tokenHash && inv.status === 'PENDING'
  );

  if (!invitation) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INVALID_INVITATION', message: 'Invitation token is invalid or has already been accepted.' }],
    });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    invitation.status = 'EXPIRED';
    db.invitations.set(invitation.id, invitation);
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_EXPIRED_INVITATION', message: 'Invitation token has expired.' }],
    });
  }

  const now = new Date().toISOString();
  let targetUser = Array.from(db.users.values()).find((u) => u.email === invitation.email);

  if (!targetUser) {
    // Create new user
    targetUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: invitation.email,
      password_hash: hashPassword(password),
      first_name,
      last_name,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    };
    db.users.set(targetUser.id, targetUser);
  } else {
    // Existing user, update details and password
    targetUser.first_name = first_name;
    targetUser.last_name = last_name;
    targetUser.password_hash = hashPassword(password);
    targetUser.updated_at = now;
    db.users.set(targetUser.id, targetUser);
  }

  // Update membership
  const membershipId = `mem_${invitation.tenant_id}_${targetUser.id}`;
  const existingMembership = db.memberships.get(membershipId);

  if (!existingMembership) {
    const newMembership: TenantMembership = {
      id: membershipId,
      user_id: targetUser.id,
      tenant_id: invitation.tenant_id,
      status: 'ACTIVE',
      is_default: true,
      created_at: now,
      updated_at: now,
    };
    db.memberships.set(membershipId, newMembership);
  } else if (existingMembership.status !== 'ACTIVE') {
    existingMembership.status = 'ACTIVE';
    existingMembership.updated_at = now;
    db.memberships.set(membershipId, existingMembership);
  }

  // Find or create role inside tenant
  const tenantRoles = db.getRolesByTenant(invitation.tenant_id);
  let assignedRole = tenantRoles.find((r) => r.role_code === invitation.role_code);

  if (!assignedRole) {
    assignedRole = tenantRoles.find((r) => r.role_code === 'ADMINISTRATOR') || tenantRoles[0];
  }

  if (assignedRole) {
    db.userRoleAssignments.set(`ura_${targetUser.id}_${assignedRole.id}`, {
      id: `ura_${targetUser.id}_${assignedRole.id}`,
      tenant_id: invitation.tenant_id,
      user_id: targetUser.id,
      role_id: assignedRole.id,
    });
  }

  // Update invitation status
  invitation.status = 'ACCEPTED';
  invitation.accepted_at = now;
  invitation.updated_at = now;
  db.invitations.set(invitation.id, invitation);

  const targetTenant = db.getTenant(invitation.tenant_id)!;

  db.recordAuditLog({
    tenant_id: targetTenant.id,
    actor_id: targetUser.id,
    actor_email: targetUser.email,
    action: 'INVITATION.ACCEPTED',
    resource_type: 'user',
    resource_id: targetUser.id,
  });

  const tokenValue = signJwt({
    sub: targetUser.id,
    email: targetUser.email,
    tenant_id: targetTenant.id,
    roles: assignedRole ? [assignedRole.role_code] : [],
    scopes: ['*'],
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      token: tokenValue,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
      },
      activeTenant: targetTenant,
    },
  });
});

// ==========================================
// 2. PROTECTED TENANT DOMAIN ROUTES
// All routes below run through tenantResolver
// ==========================================

apiRouter.use(tenantResolver);

// Global Master Data Foundation Router
apiRouter.use('/master', masterDataRouter);

// Phase 3 Accounting Core & Double-Entry Ledger Router
apiRouter.use('/accounting', accountingRouter);

// Phase 4 Sales Engine Router
apiRouter.use('/sales', salesRouter);

// Phase 6 Accounts Receivable & Collections Router
apiRouter.use('/receivables', receivablesRouter);

// Phase 7 Procurement & Accounts Payable Routers
apiRouter.use('/procurement', procurementRouter);
apiRouter.use('/payables', payablesRouter);

// Phase 8 Global Inventory & Warehouse Management Router
apiRouter.use('/inventory', inventoryRouter);

// Phase 9 Global POS & Omnichannel Sales Router
apiRouter.use('/pos', posRouter);

// Phase 10 Global Tax Engine & Compliance Router
apiRouter.use('/tax', taxRouter);

// Phase 11 Global E-Invoicing & Fiscal Document Compliance Router
apiRouter.use('/compliance', complianceRouter);
apiRouter.use('/fiscal', complianceRouter);

/**
 * GET /api/v1/tenant/context
 * Returns active business context & accessible structural scopes
 */
apiRouter.get('/tenant/context', (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user, roles, legalEntity, branch, warehouse } = req.context!;
  const legalEntities = db.getLegalEntitiesByTenant(tenant.id);
  const branches = db.getBranchesByTenant(tenant.id);
  const warehouses = db.getWarehousesByTenant(tenant.id);
  const userMemberships = db.getMembershipsByUser(user.id).map((m) => ({
    tenant_id: m.tenant_id,
    tenant_name: db.getTenant(m.tenant_id)?.legal_name || 'Workspace',
    is_default: m.is_default,
  }));

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      tenant,
      activeContext: {
        legalEntity,
        branch,
        warehouse,
      },
      legalEntities,
      branches,
      warehouses,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      roles,
      memberships: userMemberships,
    },
  });
});

/**
 * GET /api/v1/tenant/organization
 */
apiRouter.get('/tenant/organization', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: req.context!.tenant,
  });
});

/**
 * PUT /api/v1/tenant/organization
 */
apiRouter.put(
  '/tenant/organization',
  requirePermission('edit', 'tenant'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const {
      legal_name,
      trade_name,
      business_type,
      industry,
      timezone,
      contact_email,
      contact_phone,
      address,
    } = req.body;

    const updatedTenant = {
      ...tenant,
      legal_name: legal_name || tenant.legal_name,
      trade_name: trade_name || tenant.trade_name,
      business_type: business_type || tenant.business_type,
      industry: industry || tenant.industry,
      timezone: timezone || tenant.timezone,
      contact_email: contact_email || tenant.contact_email,
      contact_phone: contact_phone || tenant.contact_phone,
      address: address ? { ...tenant.address, ...address } : tenant.address,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
      version: tenant.version + 1,
    };

    db.tenants.set(tenant.id, updatedTenant);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'ORG.SETTINGS_UPDATED',
      resource_type: 'tenant',
      resource_id: tenant.id,
      changes: req.body,
    });

    return res.json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: updatedTenant,
    });
  }
);

/**
 * GET /api/v1/tenant/legal-entities
 */
apiRouter.get('/tenant/legal-entities', (req: AuthenticatedRequest, res: Response) => {
  const entities = db.getLegalEntitiesByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: entities,
  });
});

/**
 * POST /api/v1/tenant/legal-entities
 */
apiRouter.post(
  '/tenant/legal-entities',
  requirePermission('create', 'legal_entities'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { entity_code, legal_name, country_code, currency_code, timezone, tax_registrations } = req.body;

    if (!entity_code || !legal_name || !country_code) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Entity code, legal name, and country required.' }],
      });
    }

    const now = new Date().toISOString();
    const newEntity: LegalEntity = {
      id: `le_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tenant.id,
      entity_code,
      legal_name,
      country_code,
      currency_code: currency_code || tenant.base_currency_code,
      timezone: timezone || tenant.timezone,
      jurisdiction_code: country_code,
      tax_registrations: tax_registrations || [],
      fiscal_start_month: 1,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
      version: 1,
    };

    db.legalEntities.set(newEntity.id, newEntity);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'LEGAL_ENTITY.CREATED',
      resource_type: 'legal_entity',
      resource_id: newEntity.id,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: newEntity,
    });
  }
);

/**
 * GET /api/v1/tenant/branches
 */
apiRouter.get('/tenant/branches', (req: AuthenticatedRequest, res: Response) => {
  const branches = db.getBranchesByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: branches,
  });
});

/**
 * POST /api/v1/tenant/branches
 */
apiRouter.post(
  '/tenant/branches',
  requirePermission('create', 'branches'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { legal_entity_id, branch_code, branch_name, country_code, timezone, address } = req.body;

    if (!legal_entity_id || !branch_code || !branch_name) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Legal entity ID, branch code, and name required.' }],
      });
    }

    const now = new Date().toISOString();
    const newBranch: Branch = {
      id: `br_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tenant.id,
      legal_entity_id,
      branch_code,
      branch_name,
      country_code: country_code || tenant.country_code,
      timezone: timezone || tenant.timezone,
      currency_code: tenant.base_currency_code,
      address: address || {
        street_address: 'Not configured',
        city: 'Not configured',
        state_province: 'Not configured',
        postal_code: 'Not configured',
        country_code: country_code || tenant.country_code,
      },
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
      version: 1,
    };

    db.branches.set(newBranch.id, newBranch);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'BRANCH.CREATED',
      resource_type: 'branch',
      resource_id: newBranch.id,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: newBranch,
    });
  }
);

/**
 * GET /api/v1/tenant/warehouses
 */
apiRouter.get('/tenant/warehouses', (req: AuthenticatedRequest, res: Response) => {
  const warehouses = db.getWarehousesByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: warehouses,
  });
});

/**
 * POST /api/v1/tenant/warehouses
 */
apiRouter.post(
  '/tenant/warehouses',
  requirePermission('create', 'warehouses'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { branch_id, warehouse_code, warehouse_name, address } = req.body;

    if (!branch_id || !warehouse_code || !warehouse_name) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Branch ID, warehouse code, and name required.' }],
      });
    }

    const now = new Date().toISOString();
    const newWarehouse: Warehouse = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tenant.id,
      branch_id,
      warehouse_code,
      warehouse_name,
      address: address || {
        street_address: 'Not configured',
        city: 'Not configured',
        state_province: 'Not configured',
        postal_code: 'Not configured',
        country_code: tenant.country_code,
      },
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
      version: 1,
    };

    db.warehouses.set(newWarehouse.id, newWarehouse);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'WAREHOUSE.CREATED',
      resource_type: 'warehouse',
      resource_id: newWarehouse.id,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: newWarehouse,
    });
  }
);

/**
 * GET /api/v1/tenant/users
 */
apiRouter.get('/tenant/users', (req: AuthenticatedRequest, res: Response) => {
  const usersWithRoles = db.getUsersByTenant(req.context!.tenant.id).map((u) => ({
    id: u.user.id,
    email: u.user.email,
    first_name: u.user.first_name,
    last_name: u.user.last_name,
    status: u.user.status,
    roles: u.roles.map((r) => r.role_name),
    membership_status: u.membership.status,
  }));

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: usersWithRoles,
  });
});

/**
 * POST /api/v1/tenant/users/invite
 */
apiRouter.post(
  '/tenant/users/invite',
  requirePermission('invite', 'users'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user: actor } = req.context!;
    const { email, first_name, last_name, role_code } = req.body;

    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Email, first name, and last name required.' }],
      });
    }

    const now = new Date().toISOString();
    let targetUser = Array.from(db.users.values()).find((u) => u.email === email.toLowerCase());

    if (!targetUser) {
      targetUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: email.toLowerCase(),
        password_hash: hashPassword('ChangeMe123!'),
        first_name,
        last_name,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      };
      db.users.set(targetUser.id, targetUser);
    }

    const membershipId = `mem_${tenant.id}_${targetUser.id}`;
    const newMembership: TenantMembership = {
      id: membershipId,
      user_id: targetUser.id,
      tenant_id: tenant.id,
      status: 'ACTIVE',
      is_default: false,
      created_at: now,
      updated_at: now,
    };
    db.memberships.set(membershipId, newMembership);

    const roles = db.getRolesByTenant(tenant.id);
    const assignedRole = roles.find((r) => r.role_code === role_code) || roles[0];

    if (assignedRole) {
      db.userRoleAssignments.set(`ura_${targetUser.id}_${assignedRole.id}`, {
        id: `ura_${targetUser.id}_${assignedRole.id}`,
        tenant_id: tenant.id,
        user_id: targetUser.id,
        role_id: assignedRole.id,
      });
    }

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'USER.INVITED',
      resource_type: 'user',
      resource_id: targetUser.id,
      changes: { email, role_code },
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: {
        id: targetUser.id,
        email: targetUser.email,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        status: targetUser.status,
      },
    });
  }
);

/**
 * GET /api/v1/tenant/roles
 */
apiRouter.get('/tenant/roles', (req: AuthenticatedRequest, res: Response) => {
  const roles = db.getRolesByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: roles,
  });
});

/**
 * GET /api/v1/tenant/dashboard
 * Real data-driven dashboard API yielding zero-data when no transactional records exist.
 */
apiRouter.get('/tenant/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const metrics = db.getDashboardMetrics(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: metrics,
  });
});

/**
 * GET /api/v1/tenant/search
 */
apiRouter.get('/tenant/search', (req: AuthenticatedRequest, res: Response) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  const tenantId = req.context!.tenant.id;

  if (!query) {
    return res.json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: { results: [] },
    });
  }

  const results: { type: string; title: string; subtitle: string; id: string }[] = [];

  // Search Legal Entities
  for (const entity of db.getLegalEntitiesByTenant(tenantId)) {
    if (entity.legal_name.toLowerCase().includes(query) || entity.entity_code.toLowerCase().includes(query)) {
      results.push({ type: 'Legal Entity', title: entity.legal_name, subtitle: entity.entity_code, id: entity.id });
    }
  }

  // Search Branches
  for (const branch of db.getBranchesByTenant(tenantId)) {
    if (branch.branch_name.toLowerCase().includes(query) || branch.branch_code.toLowerCase().includes(query)) {
      results.push({ type: 'Branch', title: branch.branch_name, subtitle: branch.branch_code, id: branch.id });
    }
  }

  // Search Warehouses
  for (const wh of db.getWarehousesByTenant(tenantId)) {
    if (wh.warehouse_name.toLowerCase().includes(query) || wh.warehouse_code.toLowerCase().includes(query)) {
      results.push({ type: 'Warehouse', title: wh.warehouse_name, subtitle: wh.warehouse_code, id: wh.id });
    }
  }

  // Search Users
  for (const u of db.getUsersByTenant(tenantId)) {
    if (
      u.user.email.toLowerCase().includes(query) ||
      u.user.first_name.toLowerCase().includes(query) ||
      u.user.last_name.toLowerCase().includes(query)
    ) {
      results.push({
        type: 'Team Member',
        title: `${u.user.first_name} ${u.user.last_name}`,
        subtitle: u.user.email,
        id: u.user.id,
      });
    }
  }

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: { results },
  });
});

/**
 * GET /api/v1/tenant/notifications
 */
apiRouter.get('/tenant/notifications', (req: AuthenticatedRequest, res: Response) => {
  const notifications = db.getNotificationsByUser(req.context!.tenant.id, req.context!.user.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: notifications,
  });
});

/**
 * GET /api/v1/tenant/audit-logs
 */
apiRouter.get('/tenant/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogsByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: logs,
  });
});

/**
 * GET /api/v1/tenant/approvals
 */
apiRouter.get('/tenant/approvals', (req: AuthenticatedRequest, res: Response) => {
  const instances = Array.from(db.workflowInstances.values()).filter(
    (w) => w.tenant_id === req.context!.tenant.id
  );
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: instances,
  });
});

/**
 * GET /api/v1/tenant/settings
 */
apiRouter.get('/tenant/settings', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.settings.get(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: settings || null,
  });
});

/**
 * PUT /api/v1/tenant/settings
 */
apiRouter.put(
  '/tenant/settings',
  requirePermission('edit', 'config'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const existing = db.settings.get(tenant.id) || {
      tenant_id: tenant.id,
      business: {
        trade_name: tenant.trade_name,
        legal_name: tenant.legal_name,
        industry: tenant.industry,
        business_type: tenant.business_type,
        timezone: tenant.timezone,
        base_currency: tenant.base_currency_code,
      },
      localization: { date_format: 'YYYY-MM-DD', time_format: '24h', number_format: 'STANDARD' },
      numbering_sequences: [],
      notifications: { email_alerts: true, approval_reminders: true },
      security: { session_timeout_minutes: 15, mfa_required: false },
    };

    const updated = {
      ...existing,
      ...req.body,
      tenant_id: tenant.id,
    };

    db.settings.set(tenant.id, updated);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'SETTINGS.UPDATED',
      resource_type: 'settings',
      resource_id: tenant.id,
      changes: req.body,
    });

    return res.json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: updated,
    });
  }
);

// ==========================================
// PHASE 2 ADDITIONAL ENHANCED PLATFORM ENDPOINTS
// ==========================================

import crypto from 'crypto';

/**
 * GET /api/v1/tenant/business-units
 */
apiRouter.get('/tenant/business-units', (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const bus = db.getBusinessUnitsByTenant(tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: bus,
  });
});

/**
 * POST /api/v1/tenant/business-units
 */
apiRouter.post(
  '/tenant/business-units',
  requirePermission('edit', 'tenant'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { legal_entity_id, parent_business_unit_id, name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Name and code are required.' }],
      });
    }

    const now = new Date().toISOString();
    const bu: BusinessUnit = {
      id: `bu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tenant.id,
      legal_entity_id: legal_entity_id || null,
      parent_business_unit_id: parent_business_unit_id || null,
      name,
      code,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
      version: 1,
    };

    db.businessUnits.set(bu.id, bu);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'BUSINESS_UNIT.CREATED',
      resource_type: 'business_unit',
      resource_id: bu.id,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: bu,
    });
  }
);

/**
 * GET /api/v1/tenant/invitations
 */
apiRouter.get('/tenant/invitations', (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const invitations = db.getInvitationsByTenant(tenant.id).map((inv) => ({
    id: inv.id,
    tenant_id: inv.tenant_id,
    email: inv.email,
    role_code: inv.role_code,
    scope_type: inv.scope_type,
    scope_id: inv.scope_id,
    status: inv.status,
    expires_at: inv.expires_at,
    created_at: inv.created_at,
    accepted_at: inv.accepted_at,
  }));

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: invitations,
  });
});

/**
 * POST /api/v1/tenant/invitations
 */
apiRouter.post(
  '/tenant/invitations',
  requirePermission('invite', 'users'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { email, role_code, scope_type, scope_id } = req.body;

    if (!email || !role_code) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Email and role_code are required.' }],
      });
    }

    const rawToken = `bv_inv_${crypto.randomBytes ? crypto.randomBytes(16).toString('hex') : Math.random().toString(36).substring(2)}`;
    const tokenHash = hashPassword(rawToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invitation: UserInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tenant.id,
      email: email.toLowerCase().trim(),
      role_code,
      scope_type: scope_type || 'TENANT',
      scope_id: scope_id || null,
      token_hash: tokenHash,
      status: 'PENDING',
      expires_at: expiresAt,
      accepted_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
      version: 1,
    };

    db.invitations.set(invitation.id, invitation);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'USER.INVITATION_CREATED',
      resource_type: 'user_invitation',
      resource_id: invitation.id,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: {
        invitation: {
          id: invitation.id,
          tenant_id: invitation.tenant_id,
          email: invitation.email,
          role_code: invitation.role_code,
          scope_type: invitation.scope_type,
          scope_id: invitation.scope_id,
          status: invitation.status,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
        },
        rawToken,
      },
    });
  }
);

/**
 * GET /api/v1/tenant/permissions
 */
apiRouter.get('/tenant/permissions', (req: AuthenticatedRequest, res: Response) => {
  const perms = Array.from(db.permissions.values());
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: perms,
  });
});

/**
 * GET /api/v1/tenant/roles
 */
apiRouter.get('/tenant/roles', (req: AuthenticatedRequest, res: Response) => {
  const { tenant } = req.context!;
  const roles = db.getRolesByTenant(tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: roles,
  });
});

/**
 * POST /api/v1/tenant/roles
 */
apiRouter.post(
  '/tenant/roles',
  requirePermission('edit', 'config'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { role_code, role_name, description, permission_ids } = req.body;

    if (!role_code || !role_name) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Role code and role name are required.' }],
      });
    }

    const now = new Date().toISOString();
    const roleId = `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRole: Role = {
      id: roleId,
      tenant_id: tenant.id,
      role_code: role_code.toUpperCase().replace(/\s+/g, '_'),
      role_name,
      description: description || '',
      is_system: false,
      permission_ids: permission_ids || [],
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
      version: 1,
    };

    db.roles.set(newRole.id, newRole);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'ROLE.CREATED',
      resource_type: 'role',
      resource_id: newRole.id,
    });

    return res.status(201).json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: newRole,
    });
  }
);

/**
 * PUT /api/v1/tenant/roles/:id
 */
apiRouter.put(
  '/tenant/roles/:id',
  requirePermission('edit', 'config'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user } = req.context!;
    const { id } = req.params;
    const { role_name, description, permission_ids } = req.body;

    const role = db.roles.get(id);
    if (!role || role.tenant_id !== tenant.id || role.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_ROLE_NOT_FOUND', message: 'Role not found or deleted.' }],
      });
    }

    if (role.is_system) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_SYSTEM_ROLE', message: 'Cannot modify system roles.' }],
      });
    }

    role.role_name = role_name || role.role_name;
    role.description = description !== undefined ? description : role.description;
    role.permission_ids = permission_ids || role.permission_ids;
    role.updated_at = new Date().toISOString();
    role.updated_by = user.id;
    role.version += 1;

    db.roles.set(role.id, role);

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'ROLE.UPDATED',
      resource_type: 'role',
      resource_id: role.id,
    });

    return res.json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: role,
    });
  }
);

/**
 * POST /api/v1/tenant/users/:userId/roles
 */
apiRouter.post(
  '/tenant/users/:userId/roles',
  requirePermission('invite', 'users'),
  (req: AuthenticatedRequest, res: Response) => {
    const { tenant, user: actor } = req.context!;
    const { userId } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Role ID is required.' }],
      });
    }

    const membership = db.getMembership(userId, tenant.id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_MEMBERSHIP_NOT_FOUND', message: 'User is not a member of this tenant.' }],
      });
    }

    const role = db.roles.get(role_id);
    if (!role || role.tenant_id !== tenant.id || role.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_ROLE_NOT_FOUND', message: 'Role not found.' }],
      });
    }

    const assignmentKey = `ura_${userId}_${role_id}`;
    db.userRoleAssignments.set(assignmentKey, {
      id: assignmentKey,
      tenant_id: tenant.id,
      user_id: userId,
      role_id,
    });

    db.recordAuditLog({
      tenant_id: tenant.id,
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'USER.ROLE_ASSIGNED',
      resource_type: 'user_role_assignment',
      resource_id: assignmentKey,
    });

    return res.json({
      success: true,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      data: { userId, role_id, role_name: role.role_name },
    });
  }
);
