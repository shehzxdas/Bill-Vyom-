# Bill Vyom — Platform Security, Authorization, & Zero-Trust Policies
## Authoritative Security Constitution

---

### 1. Zero-Trust Architecture Postulates

Within the Bill Vyom operational infrastructure:
- **No Implicit Trust**: Internal networks or cell boundaries do not establish trust.
- **Mutual TLS (mTLS)**: Every microservice-to-microservice gRPC call is validated and encrypted using SPIFFE/SPIRE dynamic certificate issuing.
- **Principle of Least Privilege**: Access to data layers, storage segments, or log brokers is restricted to the specific service context executing the task.

---

### 2. Authentication & JWT Token Profiles

Identity authentication is managed independently from presentation runtimes using **OAuth 2.1 / OIDC (OpenID Connect)**.
- **Token Format**: Standard JSON Web Tokens (JWT) symmetrically signed via RSA-256 keys rotated every 24 hours.
- **Access Token Expiry**: 15 minutes.
- **Refresh Token Rotation**: Mandatory on every access token reissue.

#### Standard JWT Payload Claims

```json
{
  "iss": "https://auth.billvyom.com",
  "sub": "user_018f3c8b-d53a-7f2c-b19e-3f4a5b6c7d8e",
  "aud": "https://api.billvyom.com",
  "exp": 1786576800,
  "nbf": 1786575900,
  "tenant_id": "018f3c7e-92b4-7d5a-be42-f8c691f1a234",
  "default_branch_id": "018f3c7e-92e1-7da3-9b4e-28c409fb1a99",
  "user_metadata": {
    "first_name": "Shehzad",
    "last_name": "Asmugarithottam"
  },
  "roles": ["STORE_MANAGER"],
  "scopes": [
    "billing:create",
    "billing:read",
    "inventory:read",
    "accounting:read"
  ]
}
```

---

### 3. Granular RBAC + ABAC Policy Matrix

Access resolution is evaluated using a dual Role-Based and Attribute-Based Access Control logic:

```
  [ INBOUND USER REQUEST ]
             │
             ▼
[ Check RBAC Scope Permissions ]  ──► (Rejected if scope not in User JWT)
             │
             ▼ (Approved)
[ Check ABAC Scope Invariant ]    ──► Assert user_metadata.tenant_id == resource.tenant_id
             │
             ▼ (Approved)
[ SQL Policy Enforcement ]        ──► SET LOCAL app.current_tenant_id = user.tenant_id
```

#### Core Resource Permissions Catalog

| Resource Name | Scope | Role Entitlements | ABAC Constraint |
| :--- | :--- | :--- | :--- |
| `billing:invoices` | `create` | `OWNER`, `CASHIER`, `STORE_MANAGER` | Must write to own `branch_id` context. |
| `accounting:ledger` | `write` | `OWNER`, `FINANCE_MANAGER` | Only selectable during an open `fiscal_year`. |
| `inventory:stock` | `adjust`| `OWNER`, `STORE_MANAGER` | Restrict to assigned physical `warehouse_id`. |
| `tenant:config` | `write` | `OWNER` | Requires primary tenant authorization scope. |

---

### 4. Zero Direct DB Database Access for Support (Super Admins)

To protect financial records and private customer PII:
- **No Direct DB Access**: System administrators and platform support staff are strictly forbidden from connecting directly to SQL production databases.
- **Impersonation Logs**: Support staff requiring access to troubleshoot a tenant workspace must request explicit **Impersonation Sessions** approved via an asynchronous workflow by the tenant OWNER.
- **Immutable Support Audit trail**: All impersonation sessions generate high-resolution audit logs detailing target read paths and actions, written directly to a locked, append-only ClickHouse storage layer.

---

### 5. Cryptography & Secret Management

- **Data at Rest**: Storage volumes (YugabyteDB nodes, S3 Object Storage buckets) use AES-256 envelope encryption.
- **Encryption Keys**: Rotated automatically every 90 days via HashiCorp Vault.
- **Symmetric Keys**: Enforce strict separation of database credentials, OAuth client secrets, and integration API keys. Secrets must **NEVER** be committed to Git.
