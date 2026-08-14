# Bill Vyom — Global Hyperscale Business Operating System
## Authoritative Architecture Specification & Constitution

---

### 1. Architectural Core Principles

The architectural design of Bill Vyom is governed by a strict, immutable contract of layer isolation:

```
  [ CLIENT RUNTIMES / PRESENTATION LAYERS ]
    (Web, Mobile, Desktop POS, SDK Integrations)
                      │
                      ▼ (Contract-Driven API / gRPC-Web / REST HTTPS)
  [ INGRESS GATEWAY / ROUTING FABRIC ]
    (OIDC Token Validation, Global Router, Cell Router)
                      │
                      ▼ (Internal gRPC / Private Service Mesh)
  [ INDEPENDENT STATELESS SERVICE COMPUTE ]
    (Invoicing, Inventory Ledger, Core Financial Postings)
                      │
                      ▼ (Dual transactional commit)
  [ TRANSACTIONAL OLTP STATE ] ────► [ TRANSACTIONAL OUTBOX ]
    (Serializable SQL Shards)             │
                                          ▼ (Log Reader / CDC Engine)
                                     [ KAFKA / REDPANDA MESSAGE BROKER ]
                                          │
                                          ├───────────────┐
                                          ▼               ▼
                                    [ CLICKHOUSE ]  [ OPENSEARCH ]
                                     (OLAP Reporting) (Search Index)
```

1. **Strict Dependency Hierarchy**: `DOMAIN CORE → APPLICATION SERVICES → API CONTRACTS → SDKS → CLIENT ADAPTERS`.
   - The core domain model and business rules **MUST NOT** possess any direct or indirect compilation dependency on client presentation frameworks (such as React or Flutter), target operating systems, or device hardware layers.
2. **Device Independence**: Client applications function strictly as **Thin View Presenters**. Business valuation formulas, statutory tax parsing, inventory stock accounting, and double-entry general ledger rules run strictly on domain authorities.
3. **Cell-Based Scalability**: To accommodate millions of organizations without central bottleneck limitations, the platform is partitioned into self-contained operational deployment rings called **Cells**.
4. **Offline Resilience & Edge Compatibility**: Local deployments must implement a localized version of the central application service boundaries, executing against an embedded ACID-compliant SQLite layer, synchronized via logical vector clocks.
5. **Just-In-Time Structural Boundaries**: Physical directories, packages, or applications are created in the workspace filesystem ONLY when their respective capabilities are actively implemented and compiled. All future or prospective architectural layers must be purely documented inside `REPOSITORY_STRUCTURE.md` to prevent the introduction of architectural noise, empty folders, or fake placeholder configurations.

---

### 2. Platform Deployment Topologies

#### 2.1 Multi-Region Cloud Deployment
The global SaaS infrastructure is deployed in active-active topologies across geographic zones:
- **Global Control Plane**: Replicated globally with Raft consensus, managing core licensing, global user directory, global tenancy indexing, and DNS cell routing.
- **Regional Data Planes**: Pinned to local cloud regions (e.g., India South, EU West, US East) to ensure sovereign compliance with local data protection acts (DPDPA, GDPR).

#### 2.2 Local Edge Server Mode
For dense physical environments (e.g., a hypermarket with 50 registers), a local physical edge device functions as the localized cell controller:
- Hosts a micro-compiled Go runtime, local Redis session cache, local SQLite persistence file, and local printing proxies.
- Syncs asynchronously with the centralized cloud control plane for aggregate backups, centralized inventory forecasting, and financial consolidations.

---

### 3. Cell-Based Architecture Detail

Each platform cell acts as a complete, self-contained operational system:
- **Tenant Allocation**: Up to 25,000 active tenants are allocated to a single cell based on location, plan tier, and data residency laws.
- **Fail-Safe Isolation**: A database crash or system failure in Cell 12 has zero impact on Cell 13.
- **Hot Tenant Mitigation**: Massively active tenants are migrated automatically to dedicated, single-tenant cells without exposing or modifying public API endpoints.

---

### 4. High-Scale Transaction & Event Processing

Each invoice creation triggers a multi-step mutation chain:
- **Synchronous Critical Path**:
  1. Authorize identity, verify RBAC permissions.
  2. Reserve inventory quantities (acquire row lock on active warehouse stock).
  3. Resolve taxes (CGST/SGST/IGST or VAT) on the core tax calculation engine.
  4. Build balanced double-entry General Ledger Lines (`Σ Debits == Σ Credits`).
  5. Commit both business record and Outbox event atomicity in a single transactional query.
- **Asynchronous Pipeline**:
  1. Forward `InvoiceCreatedEvent` to Redpanda event stream.
  2. Consume event to build full-text search indexes in OpenSearch.
  3. Ingest data points into ClickHouse for real-time analytics.
  4. Forward notification hooks to Email and WhatsApp queues.

---

### 5. Architectural Observability & Telemetry

- **Context Propagation**: Every inbound HTTP, gRPC, or queue processing context must propagate an OpenTelemetry-compatible `traceparent` header.
- **Privacy Enforcement**: Log streams must be scrubbed of customer PII, raw payment variables, and authorization secrets before writing to storage.
