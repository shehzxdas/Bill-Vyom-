# Dependency Boundaries & Import Governance Rules

This document outlines the strict dependency rules enforced across the Bill Vyom monorepo to ensure clean separation of concerns, high modularity, and cross-platform compatibility.

---

### 1. The Core Dependency Hierarchy

To keep our business logic completely decoupled from presentation frameworks, database engines, and runtime environments, all files and imports must strictly adhere to the following downward-only flow:

```
CLIENT (React / future mobile-desktop viewports)
  │
  ▼
API CLIENT (packages/api-client)
  │
  ▼
API CONTRACTS (packages/contracts)
  │
  ▼
APPLICATION SERVICES / CONTROLLERS (src/server)
  │
  ▼
DOMAIN LOGIC (packages/domain)
  │
  ▼
INFRASTRUCTURE (config / observability)
  │
  ▼
DATABASE ENGINE (in-memory isolated transactions)
```

---

### 2. Strict Architectural Invariance Rules

#### 2.1 Web & App Client Isolation
*   **No Direct Database Access**: Frontend clients (such as `apps/tenant` or `apps/admin`) are **STRICTLY PROHIBITED** from importing database models, query builders, or storage adapters directly. All state persistence must be conducted via the standardized `apiClient` communicating over HTTP/HTTPS.
*   **Horizontal Workspace Protection**: The admin client (`apps/admin`) must never import files from the tenant client (`apps/tenant`), and vice versa. Common layout assets, styles, or visual controls must be cleanly extracted to the shared `packages/ui` package.

#### 2.2 Domain Independence
*   **Zero Framework Dependencies**: The core business domain (`packages/domain` and `/src/domain`) must be written in pure TypeScript. It must **never** import React, hooks (`useState`, `useEffect`), UI controls, or design-system utilities.
*   **Zero Browser/Runtime Assumptions**: Domain logic must not depend on browser-exclusive global variables (e.g., `window`, `document`, `localStorage`) or specific mobile/desktop APIs. This ensures identical business rule evaluation across server environments, offline client nodes, and compiled native packages.

#### 2.3 Shared Package Constraints
*   **Zero App Imports**: Genuinely shared packages under `packages/*` must never import files or utilities from any presentation application folder under `apps/*`.
*   **Strict Dependency Registration**: Every new npm or external workspace dependency must be formally added inside `package.json` before being declared in imports. No implicit or floating package loading is permitted.

---

### 3. Boundary Enforcement

These dependency boundaries are actively checked via:
1.  **Static Analysis**: Project references in `tsconfig.json` protect against circular or invalid cross-project compilation.
2.  **Lint & Test Suites**: Automated test runners check the security, isolation, and module limits of our runtime execution flow.
