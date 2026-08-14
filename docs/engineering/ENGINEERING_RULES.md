# Bill Vyom — Hard Engineering Rules & Code Quality Standards
## Authoritative Engineering Rules Constitution

---

### 1. Absolute Code Base Rules

1. **Strict No-Mocking Rule**: 
   - Code submissions, API responses, and user interfaces are strictly forbidden from executing or serving fake, mock, dummy, placeholder, or fabricated demonstration data.
   - If real data is absent, the interface must present a truthful empty state: `₹ 0.00`, `0`, "No data available", or "Not Configured".
2. **Strict Code-First and Contract Alignment**:
   - All REST controllers, gRPC models, and message serialization engines must compile against the shared, version-locked Protobuf definitions in `packages/contracts/`.
3. **No Direct UI-Level State Modification on Storage**:
   - Web (React) and Mobile (Flutter) clients are prohibited from accessing, creating, or modifying transactional data structures directly. All mutations must traverse the contract-generated SDKs.

---

### 2. High-Precision Numeric Constraints

- **Floating-point types (`float`, `double`) are strictly prohibited** for calculating financial balances, prices, discounts, or tax levels.
- **Enforced Type**: System-level calculations must utilize exact fixed-point decimals represented in database and code layers as **`DECIMAL(18, 4)`**.
- **Quantities**: Inventory quantities must support fractional increments to standard precisions represented as **`DECIMAL(12, 3)`**.
- **Rounding Rule**: Standard tax and final balance roundings must implement **Half-Even Rounding (Banker's Rounding)** to prevent cumulative floating-point calculation errors:

$$\text{Round}(1.245, 2) \to 1.24 \quad \text{vs.} \quad \text{Round}(1.255, 2) \to 1.26$$

---

### 3. TypeScript / Go Coding Conventions

#### 3.1 Go microservice architecture rules
- Microservices **MUST** implement structured logging utilizing `slog` with contextual correlation keys (`trace_id`, `tenant_id`, `request_id`).
- All asynchronous worker tasks must utilize Go channels or transactional River/BullMQ queues with explicit backpressure thresholds.

#### 3.2 TypeScript / React UI architecture rules
- React modules must follow strict module boundaries inside the workspace (no nested card designs or nested folder references without explicit entry-point exports).
- CSS files must not be created or imported individually; styling is governed strictly by inline tailwind utility constraints.
- Typings must avoid using `any` at all costs.

---

### 4. Continuous Integration & Quality Checks

- **Unit Test Coverage**: Core business, ledger posting, and tax algorithms must maintain a minimum of **85% unit test coverage**.
- **Calculations Determinism**: Accounting ledger computations must run through deterministic property-based fuzz tests to verify double-entry balancing.
- **Race Condition Testing**: Go components must compile and pass testing suites under concurrency checks (`go test -race ./...`).

---

### 5. Deployment Quality Checks

- All service deployments must supply a validated, machine-readable Software Bill of Materials (SBOM) compiled in CycloneDX format.
- Multi-stage container builds must result in stateless, scratch-based or distroless images, keeping attack surface areas down to absolute minimum thresholds.
