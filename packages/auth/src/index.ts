/**
 * Bill Vyom — Auth Foundation
 * Shared authentication model schemas, OIDC JWT configurations, and security payloads.
 */

import { TokenPayload } from '../../../src/server/auth';

export interface UserSession {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
  scopes: string[];
  expiresAt: number;
}

export function parseTokenPayload(payload: TokenPayload): UserSession {
  return {
    userId: payload.sub,
    email: payload.email,
    tenantId: payload.tenant_id,
    roles: payload.roles,
    scopes: payload.scopes,
    expiresAt: payload.exp,
  };
}

export function isSessionExpired(session: UserSession): boolean {
  return session.expiresAt < Math.floor(Date.now() / 1000);
}
