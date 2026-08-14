/**
 * Bill Vyom — Authoritative Tenant Resolution & Isolation Middleware
 * Resolves authenticated identity and enforces row-level tenant boundary security.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwt, TokenPayload } from '../auth';
import { db } from '../db';
import { User, Tenant, TenantMembership, LegalEntity, Branch, Warehouse, Role } from '../../domain/types';

export interface TenantRequestContext {
  user: User;
  tenant: Tenant;
  membership: TenantMembership;
  roles: Role[];
  legalEntity?: LegalEntity;
  branch?: Branch;
  warehouse?: Warehouse;
  tokenPayload: TokenPayload;
}

export interface AuthenticatedRequest extends Request {
  context?: TenantRequestContext;
}

export function tenantResolver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_UNAUTHORIZED', message: 'Authentication required. Bearer token missing.' }],
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_INVALID_TOKEN', message: 'Invalid or expired authentication token.' }],
    });
  }

  const userId = payload.sub;
  const user = db.users.get(userId);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_USER_INACTIVE', message: 'User account is inactive or disabled.' }],
    });
  }

  // Determine target tenant ID from header or JWT
  const requestedTenantId = (req.headers['x-tenant-id'] as string) || payload.tenant_id;
  if (!requestedTenantId) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_TENANT_HEADER_MISSING', message: 'X-Tenant-ID header or token tenant required.' }],
    });
  }

  // Verify membership in requested tenant
  const membership = db.getMembership(userId, requestedTenantId);
  if (!membership) {
    return res.status(403).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{
        code: 'VAL_TENANT_ACCESS_DENIED',
        message: 'Forbidden: You are not authorized to access the requested tenant workspace.',
      }],
    });
  }

  const tenant = db.getTenant(requestedTenantId);
  if (!tenant || tenant.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_TENANT_INACTIVE', message: 'Tenant workspace is inactive or suspended.' }],
    });
  }

  // Resolve user roles in this tenant
  const userRoles = db.getUsersByTenant(requestedTenantId).find((u) => u.user.id === userId)?.roles || [];

  // Optional sub-contexts: Legal Entity, Branch, Warehouse
  const requestedLegalEntityId = req.headers['x-legal-entity-id'] as string;
  const legalEntities = db.getLegalEntitiesByTenant(requestedTenantId);
  const legalEntity = requestedLegalEntityId
    ? legalEntities.find((e) => e.id === requestedLegalEntityId)
    : legalEntities[0];

  const requestedBranchId = req.headers['x-branch-id'] as string;
  const branches = db.getBranchesByTenant(requestedTenantId, legalEntity?.id);
  const branch = requestedBranchId
    ? branches.find((b) => b.id === requestedBranchId)
    : branches[0];

  const requestedWarehouseId = req.headers['x-warehouse-id'] as string;
  const warehouses = db.getWarehousesByTenant(requestedTenantId, branch?.id);
  const warehouse = requestedWarehouseId
    ? warehouses.find((w) => w.id === requestedWarehouseId)
    : warehouses[0];

  req.context = {
    user,
    tenant,
    membership,
    roles: userRoles,
    legalEntity,
    branch,
    warehouse,
    tokenPayload: payload,
  };

  next();
}
