# Bill Vyom — Relational Database Schema & Partition Design
## Authoritative Database Constitution

---

### 1. Database Infrastructure Engine

The global transactional state of Bill Vyom is persisted on **YugabyteDB / CockroachDB** (Distributed SQL).
- **Consensus Protocol**: Raft-based distributed replication.
- **SQL Dialect**: PostgreSQL-compatible wire protocol.
- **Isolation Level**: Enforced `SERIALIZABLE` ACID transaction execution.

---

### 2. Mandatory Structural Headers

Every tenant-bound entity **MUST** contain these eight core metadata fields to guarantee audit trails, optimistic locking, and safe soft-deletes:

| Field Name | Data Type | Key Type | Default / Constraint | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY | `gen_random_uuid()` | Immutable unique identifier. |
| `tenant_id` | `UUID` | FOREIGN KEY | REFERENCES `tenants(id)` | Strict RLS partitioning boundary. |
| `created_at` | `TIMESTAMPTZ`| - | `NOW()` | Audit record creation timestamp. |
| `updated_at` | `TIMESTAMPTZ`| - | `NOW()` | Audit record last modification timestamp. |
| `created_by` | `UUID` | FOREIGN KEY | REFERENCES `users(id)` | Inbound actor attribution. |
| `updated_by` | `UUID` | FOREIGN KEY | REFERENCES `users(id)` | Modification actor attribution. |
| `deleted_at` | `TIMESTAMPTZ`| - | `NULL` | Soft delete flag (hard deletes are forbidden). |
| `version` | `INTEGER` | - | `1` | Optimistic locking concurrency tracking. |

---

### 3. Tenant Isolation Policy (PostgreSQL RLS)

To enforce strict, absolute multi-tenant security boundaries, Row-Level Security (RLS) must be configured on all operational schemas:

```sql
-- Enforce Row-Level Security on a table
ALTER TABLE billing.invoices ENABLE ROW LEVEL SECURITY;

-- Create Tenant Isolation Security Policy
CREATE POLICY tenant_isolation_policy ON billing.invoices
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

Before delegating any query to the transactional node, the API Gateway or database adapter connection must execute:

```sql
SET LOCAL app.current_tenant_id = '018f3c7e-92b4-7d5a-be42-f8c691f1a234';
```

---

### 4. Database Schema Catalog

#### 4.1 System Global & Control Plane (Region: Replicated Global)

##### `countries`
- `code`: `VARCHAR(2)` PRIMARY KEY
- `name`: `VARCHAR(100)` NOT NULL
- `default_currency_code`: `VARCHAR(3)` NOT NULL
- `tax_regime_type`: `VARCHAR(30)` NOT NULL ('GST' | 'VAT' | 'SALES_TAX')
- `is_active`: `BOOLEAN` DEFAULT true

##### `tenants`
- `id`: `UUID` PRIMARY KEY DEFAULT gen_random_uuid()
- `legal_name`: `VARCHAR(255)` NOT NULL
- `country_code`: `VARCHAR(2)` NOT NULL REFERENCES `countries(code)`
- `base_currency_code`: `VARCHAR(3)` NOT NULL
- `plan_tier`: `VARCHAR(50)` NOT NULL DEFAULT 'ENTERPRISE'
- `status`: `VARCHAR(30)` NOT NULL DEFAULT 'ACTIVE'
- Standard tracking: `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `version`

#### 4.2 Core Tenant Entities (Schema: `tenant`)

##### `branches`
- Standard Header Columns
- `branch_code`: `VARCHAR(50)` NOT NULL
- `branch_name`: `VARCHAR(255)` NOT NULL
- `country_code`: `VARCHAR(2)` NOT NULL REFERENCES `countries(code)`
- `gstin_or_tax_id`: `VARCHAR(50)` NULL
- **Constraints**: UNIQUE (`tenant_id`, `branch_code`) WHERE `deleted_at IS NULL`

##### `users`
- Standard Header Columns
- `email`: `VARCHAR(255)` NOT NULL
- `password_hash`: `VARCHAR(255)` NOT NULL
- `first_name`: `VARCHAR(100)` NOT NULL
- `last_name`: `VARCHAR(100)` NOT NULL
- `status`: `VARCHAR(30)` NOT NULL DEFAULT 'ACTIVE'
- **Constraints**: UNIQUE (`tenant_id`, `email`) WHERE `deleted_at IS NULL`

##### `roles`
- Standard Header Columns
- `role_code`: `VARCHAR(50)` NOT NULL
- `role_name`: `VARCHAR(100)` NOT NULL
- **Constraints**: UNIQUE (`tenant_id`, `role_code`) WHERE `deleted_at IS NULL`

#### 4.3 Financial Accounting Ledger (Schema: `accounting`)

##### `fiscal_years`
- Standard Header Columns
- `year_name`: `VARCHAR(50)` NOT NULL
- `start_date`: `DATE` NOT NULL
- `end_date`: `DATE` NOT NULL
- `is_closed`: `BOOLEAN` NOT NULL DEFAULT false

##### `chart_of_accounts`
- Standard Header Columns
- `account_code`: `VARCHAR(50)` NOT NULL
- `account_name`: `VARCHAR(255)` NOT NULL
- `account_type`: `VARCHAR(50)` NOT NULL ('ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE')
- `account_subtype`: `VARCHAR(50)` NOT NULL
- `parent_account_id`: `UUID` NULL REFERENCES `chart_of_accounts(id)`
- `currency_code`: `VARCHAR(3)` NOT NULL
- `is_system_locked`: `BOOLEAN` NOT NULL DEFAULT false
- **Constraints**: UNIQUE (`tenant_id`, `account_code`) WHERE `deleted_at IS NULL`

##### `journal_entries` (APPEND-ONLY)
- Standard Header Columns
- `branch_id`: `UUID` NOT NULL REFERENCES `branches(id)`
- `fiscal_year_id`: `UUID` NOT NULL REFERENCES `fiscal_years(id)`
- `entry_number`: `VARCHAR(100)` NOT NULL
- `entry_date`: `DATE` NOT NULL
- `entry_type`: `VARCHAR(50)` NOT NULL
- `narration`: `TEXT` NOT NULL
- `status`: `VARCHAR(30)` NOT NULL DEFAULT 'POSTED'
- `reversal_entry_id`: `UUID` NULL REFERENCES `journal_entries(id)`
- **Constraints**: UNIQUE (`tenant_id`, `entry_number`)

##### `journal_lines` (APPEND-ONLY)
- `id`: `UUID` PRIMARY KEY DEFAULT gen_random_uuid()
- `tenant_id`: `UUID` NOT NULL REFERENCES `tenants(id)`
- `journal_entry_id`: `UUID` NOT NULL REFERENCES `journal_entries(id)` ON DELETE CASCADE
- `account_id`: `UUID` NOT NULL REFERENCES `chart_of_accounts(id)`
- `debit_amount`: `DECIMAL(18, 4)` NOT NULL DEFAULT 0.0000
- `credit_amount`: `DECIMAL(18, 4)` NOT NULL DEFAULT 0.0000
- `memo`: `VARCHAR(255)` NULL
- **Triggers**: `BEFORE UPDATE OR DELETE` throws exception 'Financial journal records are immutable'
- **Constraints**: CHECK (`debit_amount` >= 0 AND `credit_amount` >= 0)

#### 4.4 Inventory Engine (Schema: `inventory`)

##### `products`
- Standard Header Columns
- `sku`: `VARCHAR(100)` NOT NULL
- `barcode`: `VARCHAR(100)` NULL
- `product_name`: `VARCHAR(255)` NOT NULL
- `purchase_price`: `DECIMAL(18, 4)` NOT NULL DEFAULT 0.0000
- `selling_price`: `DECIMAL(18, 4)` NOT NULL DEFAULT 0.0000
- `is_active`: `BOOLEAN` NOT NULL DEFAULT true
- **Constraints**: UNIQUE (`tenant_id`, `sku`) WHERE `deleted_at IS NULL`

##### `warehouses`
- Standard Header Columns
- `branch_id`: `UUID` NOT NULL REFERENCES `branches(id)`
- `warehouse_code`: `VARCHAR(50)` NOT NULL
- `warehouse_name`: `VARCHAR(255)` NOT NULL
- **Constraints**: UNIQUE (`tenant_id`, `warehouse_code`) WHERE `deleted_at IS NULL`

##### `stock_ledger` (APPEND-ONLY)
- `id`: `UUID` PRIMARY KEY DEFAULT gen_random_uuid()
- `tenant_id`: `UUID` NOT NULL REFERENCES `tenants(id)`
- `warehouse_id`: `UUID` NOT NULL REFERENCES `warehouses(id)`
- `product_id`: `UUID` NOT NULL REFERENCES `products(id)`
- `movement_type`: `VARCHAR(50)` NOT NULL
- `quantity`: `DECIMAL(12, 3)` NOT NULL
- `unit_cost`: `DECIMAL(18, 4)` NOT NULL
- `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT NOW()
- `created_by`: `UUID` NOT NULL REFERENCES `users(id)`

---

### 5. Composite Indexing Specifications

To avoid performance degradation across millions of tenants, composite indexes are strictly ordered:

```sql
-- Core invoice querying index
CREATE INDEX idx_invoices_tenant_lookup 
  ON billing.invoices(tenant_id, branch_id, invoice_date DESC, status);

-- Financial account querying index
CREATE INDEX idx_journal_lines_account_lookup 
  ON accounting.journal_lines(tenant_id, account_id, journal_entry_id);

-- Product catalog index
CREATE INDEX idx_products_sku_lookup 
  ON inventory.products(tenant_id, sku) WHERE deleted_at IS NULL;
```
