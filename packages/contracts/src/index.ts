/**
 * Bill Vyom — Authoritative Shared API Contracts
 * Defines standard communication protocols, request/response models, and unified status codes.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: ApiError[];
  pagination?: ApiPagination;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const API_ROUTES = {
  health: '/api/health',
  auth: {
    login: '/api/v1/auth/login',
    onboard: '/api/v1/auth/onboard',
    me: '/api/v1/auth/me',
  },
  tenant: {
    users: '/api/v1/tenant/users',
    invite: '/api/v1/tenant/users/invite',
    settings: '/api/v1/tenant/settings',
    metrics: '/api/v1/tenant/metrics',
  },
  admin: {
    tenants: '/api/v1/admin/tenants',
    users: '/api/v1/admin/users',
    metrics: '/api/v1/admin/metrics',
  }
};

/**
 * Standard utility to wrap data in a success envelope
 */
export function successResponse<T>(data: T, pagination?: ApiPagination): ApiResponse<T> {
  return {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Standard utility to wrap errors in a failure envelope
 */
export function errorResponse(code: string, message: string, field?: string): ApiResponse {
  return {
    success: false,
    errors: [{ code, message, field }],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Multiple errors response envelope
 */
export function errorsResponse(errors: ApiError[]): ApiResponse {
  return {
    success: false,
    errors,
    timestamp: new Date().toISOString(),
  };
}
