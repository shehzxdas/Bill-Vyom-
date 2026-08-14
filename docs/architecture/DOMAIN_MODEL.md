# Bill Vyom — Bounded Contexts & Domain Model Specifications
## Authoritative Domain Constitution

---

### 1. Platform Boundary Architecture

The Bill Vyom business operating system separates its core operations into distinct, isolated **Bounded Contexts**. Communication across boundaries occurs strictly via versioned asynchronous events or contract-driven synchronous interface gateways.

```
       ┌────────────────────────┐         ┌────────────────────────┐
       │   IDENTITY & AUTH      │         │     ORGANIZATION       │
       │   - Global Identity    │         │     - Legal Entities   │
       │   - RBAC Permissions   │         │     - Branches / Whs   │
       └────────────────────────┘         └────────────────────────┘
                    │                                  │
                    v                                  v
       ┌────────────────────────┐         ┌────────────────────────┐
       │     BILLING & POS      │────────►│   INVENTORY ENGINE     │
       │   - Invoicing Engine   │         │   - Stock Ledgers      │
       │   - Payment Receivables│         │   - FIFO Cost Layers   │
       └────────────────────────┘         └────────────────────────┘
                    │                                  │
                    v                                  v
       ┌────────────────────────┐         ┌────────────────────────┐
       │      TAX ENGINE        │         │   GENERAL LEDGER (GL)  │
       │   - Country tax rules  │────────►│   - Append-Only COA    │
       │   - Pluggable Adapters │         │   - Double-Entry Posting│
       └────────────────────────┘         └────────────────────────┘
```

---

### 2. Bounded Context Catalogs

#### 2.1 Identity and Access Management (IAM)
- **Scope**: Authenticate user credentials across Web, Mobile, and Desktop POS terminals. Maintain standard RBAC roles and branch permissions mapping.
- **Data Entities Owned**: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`.
- **Integrity Constraints**: Multi-factor authentication (MFA) must be enforced for administrative mutations. Passwords must never be stored inside operational ERP databases.

#### 2.2 Organization and Tenancy
- **Scope**: Core isolation tenant structure. Maps the organizational structure of legal entities, branch registries, and physically isolated warehouses.
- **Data Entities Owned**: `tenants`, `branches`, `warehouses`.
- **Tenant Rules**: Multi-company configurations are isolated at the organization level, with strict data isolation checks enforced by Row-Level Security (RLS).

#### 2.3 General Ledger (GL) & Financial Accounting
- **Scope**: The ultimate transactional authority. Ensures compliance with double-entry accounting standards.
- **Data Entities Owned**: `fiscal_years`, `chart_of_accounts`, `journal_entries`, `journal_lines`.
- **Accounting Postulate**: General Ledger adjustments are strictly **append-only**. Adjustments must refer back to a parent entry via a deterministic `reversal_entry_id`. Direct database mutations (`UPDATE`/`DELETE`) on posted ledger lines are blocked by triggers.

#### 2.4 Invoicing, POS & Billing
- **Scope**: Standard sales processing and POS cash terminal checkouts.
- **Data Entities Owned**: `customers`, `invoices`, `invoice_items`, `payments`.
- **Idempotency**: Every invoice creation or payment payload **MUST** supply a client-generated UUID `Idempotency-Key` to prevent duplicate billing processing.

#### 2.5 Inventory Engine & Costing
- **Scope**: Tracking stock movements and calculating Cost of Goods Sold (COGS).
- **Data Entities Owned**: `units_of_measure`, `products`, `stock_ledger`.
- **Inventory Postulate**: Direct modifications on stock levels are forbidden. Stock quantities must represent the sum of all historic movements inside the immutable `stock_ledger`. Stock is valued using a FIFO (First-In, First-Out) layered structure.

#### 2.6 Taxation & Compliance
- **Scope**: Localized tax rules (such as GST or VAT) dynamically matched by jurisdiction lookup codes.
- **Data Entities Owned**: `gstin_registrations`, `hsn_sac_master`, `tax_rates`, `gst_filings`.
- **Isolation Constraint**: Country-specific elements (such as GSTIN, HSN, ZATCA, GSTR) must reside in pluggable Country Pack adapter structures, leaving the core global tables country-neutral.

#### 2.7 Workflow Approvals
- **Scope**: Orchestrates multi-step approval pipelines for critical transactions (such as payroll validation, large purchase orders, or discount overrides).
- **Data Entities Owned**: `workflow_definitions`, `workflow_steps`, `workflow_instances`, `workflow_approvals`.

---

### 3. Core Domain Event Registry

All domain mutations emit asynchronous events to facilitate decoupling:
- `TenantCreatedEvent` - Emitted by Control Plane upon provisioning a new workspace.
- `InvoiceCreatedEvent` - Emitted by Billing when a sales invoice is successfully posted.
- `StockAdjustedEvent` - Emitted by Inventory when manual adjustment or shipment occurs.
- `LedgerPostedEvent` - Emitted by the posting engine when a balanced journal entry is written.
- `WorkflowApprovedEvent` - Emitted when a workflow step clears approval criteria.
