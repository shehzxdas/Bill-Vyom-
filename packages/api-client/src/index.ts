/**
 * Bill Vyom — Unified API Client Core
 * Strictly enforces type safety, security token management, and X-Tenant-ID header binding.
 */

import { ApiResponse } from '../../contracts/src/index';

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('billvyom_jwt_token');
  }

  private getTenantId(): string | null {
    const tenantStr = localStorage.getItem('billvyom_active_tenant');
    if (!tenantStr) return null;
    try {
      const tenant = JSON.parse(tenantStr);
      return tenant.id || null;
    } catch {
      return null;
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers);
    
    // Inject JWT token if available
    const token = this.getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Inject active tenant context
    const tenantId = this.getTenantId();
    if (tenantId && !headers.has('X-Tenant-ID')) {
      headers.set('X-Tenant-ID', tenantId);
    }

    // Set JSON content type by default
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(path, config);
      const json: ApiResponse<T> = await response.json();
      return json;
    } catch (error) {
      console.error(`[API Client Error] Failed on path ${path}:`, error);
      return {
        success: false,
        errors: [{
          code: 'CONNECTION_FAILURE',
          message: error instanceof Error ? error.message : 'Unable to connect to the server. Please check your network connection.',
        }],
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async get<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', headers });
  }

  public async post<T>(path: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers,
    });
  }

  public async put<T>(path: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers,
    });
  }

  public async delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
