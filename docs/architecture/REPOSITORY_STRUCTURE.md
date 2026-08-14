# Bill Vyom — Repository Structure & Directory Governance
## Authoritative Monorepo Directory Constitution

This document defines the physical layout of the Bill Vyom repository, establishing the strict boundary rules between currently active systems and future components.

---

### 1. The Just-in-Time Boundary Policy

To prevent "architectural decay" and eliminate clutter, Bill Vyom enforces a strict **Just-in-Time (JIT) Boundary Policy**:

1. **Active Realization**: A directory, package, or application folder **MUST ONLY** be created on the physical filesystem when its core capability is actively being implemented and integrated into the active build cycle.
2. **Zero Fabrication**: It is strictly forbidden to pre-emptively create empty directories, blank scaffolding, dummy router files (`export default []`), or placeholder configurations for future-phase applications (e.g., `apps/mobile/`, `apps/worker/`, `packages/observability/`).
3. **Pure Documentation for Future Phases**: Future architectural boundaries must be explicitly mapped, defined, and documented in this file, remaining as conceptual blueprints until implementation triggers their creation.

---

### 2. Active Structural Boundaries (Physical Directory Map)

The following directories represent the current, fully implemented, and production-ready boundaries of the Bill Vyom monorepo. Every file inside these folders plays an active role in compiling, running, or testing the system.

```
/
├── index.html                       # True single-page entry layout
├── package.json                     # Monorepo task-runner & root dependencies
├── tsconfig.json                    # Monorepo path alias compiler configurations
├── vite.config.ts                   # Unified Vite bundler and development proxy config
├── server.ts                        # Active Express gateway hosting APIs and static files
│
├── src/                             # Shared Application Core & Entry Point
│   ├── main.tsx                     # True client mount script
│   ├── App.tsx                      # Single, central App Router (Web, Tenant, Admin)
│   ├── index.css                    # Consolidated global Tailwind stylesheet
│   ├── domain/                      # Bounded-context types and precision mathematics
│   │   ├── types.ts                 # Authoritative data structures & entity schemas
│   │   └── decimal.ts               # Fixed-point decimal math for financial safety
│   ├── server/                      # In-Memory Database Server Core
│   │   ├── db.ts                    # Row-isolated secure transaction database state
│   │   ├── auth.ts                  # Server JWT token creation & session parsing
│   │   ├── middleware/              # Isolation & authentication interceptors
│   │   └── routes/                  # Active API endpoints (Sales, Ledger, Accounting)
│   └── tests/                       # Automated testing core
│       └── security.test.ts         # Security regressions (JWT validation, isolation checks)
│
├── apps/                            # Client Presentation Applications
│   ├── web/                         # Public Web Portal
│   │   └── src/
│   │       ├── components/          # Authoritative modular marketing landing blocks
│   │       └── pages/               # Entry portals (Tenant Login, Admin Login)
│   ├── tenant/                      # Merchant Tenant Workspace
│   │   └── src/
│   │       ├── lib/                 # Tenant contexts and API clients
│   │       ├── modules/             # Active business modules (Dashboard metrics)
│   │       └── pages/               # Core Master Directories (Products, Vendors, Customers)
│   └── admin/                       # Platform Administration Console
│       └── src/
│           └── modules/             # Super Admin controls (Dashboard, Platform Users)
│
└── packages/                        # Shared Modular Libraries
    └── ui/                          # Design System and Application Layout Shells
        └── src/
            ├── components/          # Common components (EmptyState, alerts)
            ├── layouts/             # Core container shells (AppLayout, TopBar, Sidebar)
            └── lib/                 # Style utility modifiers (cn, Tailwind mergers)
```

---

### 3. Future Structural Boundaries (Conceptual Blueprints)

When the following platform features shift from the architectural design phase to active implementation, they must be created strictly within the boundaries specified below. Do not create physical folders for these until active development begins.

#### 3.1 Background Workers (`apps/worker/`)
*   **Operational Scope**: Runs long-running asynchronous compute workloads, periodic automated backups, financial ledger close-offs, and mass notification dispatches.
*   **Architectural Entry**: A headless Node.js/Go service consuming job events from the transactional Outbox queue (BullMQ or River).
*   **Boundary Restriction**: Must never load or bundle client presentation modules (such as React, CSS, or browser-specific assets).

#### 3.2 Real-time Messaging Gateway (`apps/realtime/`)
*   **Operational Scope**: Manages high-concurrency WebSocket channels for live sales counter (POS) syncs, notification pushes, and multi-user terminal session tracking.
*   **Architectural Entry**: A stateless Socket.io or gRPC-Web gateway verifying inbound client tokens using the central auth signing key.
*   **Boundary Restriction**: Functions strictly as an active messaging relay; database mutations must be forwarded through internal gRPC endpoints to the core server API.

#### 3.3 Mobile Applications (`apps/mobile/`)
*   **Operational Scope**: Mobile native operational app (Android & iOS) designed for inventory managers, store audits, and supervisor dashboard approvals.
*   **Architectural Entry**: A Flutter-based or React Native codebase compiled against the central contracts SDK.
*   **Boundary Restriction**: Local storage must remain encrypted. Direct database calls are prohibited; all state shifts run through the unified API client.

#### 3.4 Desktop POS Client (`apps/desktop/`)
*   **Operational Scope**: Heavy physical counter billing terminal supporting offline checkout, direct receipts printer output, and integration with barcode scanning hardware.
*   **Architectural Entry**: An Electron-based or Tauri wrapper exposing a localized web client communicating with a local SQLite edge database.
*   **Boundary Restriction**: Hardware APIs (printing drivers, barcode hooks) must be isolated inside local platform adapter scripts.

#### 3.5 Localization & Translation Package (`packages/localization/`)
*   **Operational Scope**: Managed dictionary translations for multi-currency tax support and regulatory invoice printing formats.
*   **Architectural Entry**: A unified i18next translation registry loading static JSON catalogs.
*   **Boundary Restriction**: Must remain purely data-driven. Must not depend on any specific presentation frameworks.

---

### 4. Boundary Enforcement Rules

To ensure complete adherence to these boundaries during development:

1. **Clean Workspace Checks**: Continuous integration pipelines must run checks to verify that no empty folders or non-functional stubs have been committed.
2. **Circular Dependency Scans**: Direct imports across apps are strictly blocked (e.g., `apps/tenant` must never import directly from `apps/admin`). Shareable components must migrate to `packages/ui` following precise component governance before use.
3. **Contract Constraints**: Any data transfer model across boundaries must compile directly from types defined inside `src/domain/types.ts`.
