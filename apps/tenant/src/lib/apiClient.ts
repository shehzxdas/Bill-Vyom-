/**
 * Bill Vyom — Authoritative Frontend API Client & Header Contract
 * Mandatory headers: Authorization, X-Tenant-ID, X-Legal-Entity-ID, X-Branch-ID, X-Warehouse-ID, X-Idempotency-Key
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  errors?: { code: string; message: string }[];
  meta?: { requestId: string; timestamp: string };
}

class ApiClient {
  private token: string | null = null;
  private activeTenantId: string | null = null;
  private activeLegalEntityId: string | null = null;
  private activeBranchId: string | null = null;
  private activeWarehouseId: string | null = null;

  constructor() {
    this.token = localStorage.getItem('bv_auth_token');
    this.activeTenantId = localStorage.getItem('bv_tenant_id');
    this.activeLegalEntityId = localStorage.getItem('bv_legal_entity_id');
    this.activeBranchId = localStorage.getItem('bv_branch_id');
    this.activeWarehouseId = localStorage.getItem('bv_warehouse_id');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('bv_auth_token', token);
    else localStorage.removeItem('bv_auth_token');
  }

  public setTenantContext(context: {
    tenantId?: string | null;
    legalEntityId?: string | null;
    branchId?: string | null;
    warehouseId?: string | null;
  }) {
    if (context.tenantId !== undefined) {
      this.activeTenantId = context.tenantId;
      if (context.tenantId) localStorage.setItem('bv_tenant_id', context.tenantId);
      else localStorage.removeItem('bv_tenant_id');
    }
    if (context.legalEntityId !== undefined) {
      this.activeLegalEntityId = context.legalEntityId;
      if (context.legalEntityId) localStorage.setItem('bv_legal_entity_id', context.legalEntityId);
      else localStorage.removeItem('bv_legal_entity_id');
    }
    if (context.branchId !== undefined) {
      this.activeBranchId = context.branchId;
      if (context.branchId) localStorage.setItem('bv_branch_id', context.branchId);
      else localStorage.removeItem('bv_branch_id');
    }
    if (context.warehouseId !== undefined) {
      this.activeWarehouseId = context.warehouseId;
      if (context.warehouseId) localStorage.setItem('bv_warehouse_id', context.warehouseId);
      else localStorage.removeItem('bv_warehouse_id');
    }
  }

  public getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.activeTenantId) {
      headers['X-Tenant-ID'] = this.activeTenantId;
    }
    if (this.activeLegalEntityId) {
      headers['X-Legal-Entity-ID'] = this.activeLegalEntityId;
    }
    if (this.activeBranchId) {
      headers['X-Branch-ID'] = this.activeBranchId;
    }
    if (this.activeWarehouseId) {
      headers['X-Warehouse-ID'] = this.activeWarehouseId;
    }

    return headers;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const json = await response.json();
      return json as ApiResponse<T>;
    } catch (err) {
      return {
        success: false,
        errors: [{ code: 'VAL_NETWORK_ERROR', message: (err as Error).message || 'Failed to connect to backend server.' }],
      };
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
