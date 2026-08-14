/**
 * Bill Vyom — Authoritative RBAC Authorization Middleware
 * Enforces role and permission scopes on protected API endpoints.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './tenantResolver';
import { db } from '../db';

export function requirePermission(requiredAction: string, requiredResource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.context) {
      return res.status(401).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{ code: 'VAL_UNAUTHORIZED', message: 'Authentication required.' }],
      });
    }

    const { roles } = req.context;

    // OWNER has full system override
    const isOwner = roles.some((r) => r.role_code === 'OWNER');
    if (isOwner) {
      return next();
    }

    // Otherwise check permissions in db
    const hasPermission = roles.some((role) => {
      if (role.role_code === 'ADMINISTRATOR') return true;

      const permissionIds = role.permission_ids || [];
      return permissionIds.some((pId) => {
        const perm = db.permissions.get(pId);
        if (!perm) return false;
        const resourceMatch = perm.resource === requiredResource || perm.resource === '*';
        const actionMatch = perm.action === requiredAction || perm.action === '*';
        return resourceMatch && actionMatch;
      });
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        errors: [{
          code: 'VAL_PERMISSION_DENIED',
          message: `Permission denied for action '${requiredAction}' on resource '${requiredResource}'.`,
        }],
      });
    }

    next();
  };
}
