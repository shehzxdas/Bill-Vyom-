# Bill Vyom — OpenAPI, gRPC, & Event Messaging Contracts
## Authoritative Contracts Constitution

---

### 1. API Architecture Paradigm

Bill Vyom's external and internal data flows follow a multi-protocol structure:
- **Client to API Gateway**: Standard **REST HTTPS JSON** utilizing OpenAPI 3.1 specifications.
- **Client to POS Edge (Streaming)**: **gRPC-Web** or standard HTTPS for rapid batch synchronization.
- **Service to Service (Internal Cell Mesh)**: High-performance **gRPC** protocols over HTTP/2.
- **Asynchronous Pipeline (Data Planes)**: Event messages encoded via **Protobuf** or **Avro** with strict schemas.

---

### 2. Standard Header Configurations

Every inbound HTTP request to the Bill Vyom API gateway must supply these four operational headers:

```yaml
Authorization: Bearer <JWT_OIDC_ID_TOKEN>
X-Tenant-ID: "018f3c7e-92b4-7d5a-be42-f8c691f1a234"
X-Branch-ID: "018f3c7e-92e1-7da3-9b4e-28c409fb1a99"
X-Idempotency-Key: "550e8400-e29b-41d4-a716-446655440000"
```

---

### 3. API Versioning & Deprecation Policy

1. **Path Versioning**: API endpoints are strictly versioned: `/api/v1/...`, `/api/v2/...`.
2. **Deprecation Window**: Deprecated endpoints must be marked with standard headers:
   - `Sunset: Wed, 11 Nov 2026 23:59:59 GMT`
   - `Deprecation: true`
3. **Compatibility Guarantee**: Major versions are supported concurrently for 12 months to allow old Android POS systems and third-party API integrations to upgrade.

---

### 4. REST JSON Schema Standards

#### 4.1 Global Error Format Response
If a transaction fails validation or execution, the system must return a HTTP 4xx or 5xx status code with this standardized payload structure:

```json
{
  "success": false,
  "meta": {
    "requestId": "req_018f3c8b-6102-7c39-a9bf-1f2e3d4c5b6a",
    "timestamp": "2026-08-12T23:31:00Z"
  },
  "errors": [
    {
      "code": "VAL_LEDGER_UNBALANCED",
      "message": "The financial posting transaction is unbalanced. Sum of debits must equal sum of credits.",
      "field": "journal_lines",
      "details": {
        "sum_debits": "118.0000",
        "sum_credits": "100.0000"
      }
    }
  ]
}
```

#### 4.2 Invoice Creation API Payload (`POST /api/v1/invoices`)

```json
{
  "invoice_date": "2026-08-12",
  "due_date": "2026-09-12",
  "customer_id": "018f3c8b-cf1a-7b3c-912a-3b4c5d6e7f8a",
  "currency_code": "INR",
  "exchange_rate": "1.0000",
  "lines": [
    {
      "product_id": "018f3c8b-d24b-734d-a912-4c5d6e7f8b9a",
      "quantity": "5.000",
      "unit_price": "20.0000",
      "discount_amount": "0.0000",
      "tax_code": "GST_18"
    }
  ],
  "payment": {
    "payment_method": "CASH",
    "amount_paid": "118.0000"
  }
}
```

---

### 5. Protobuf Service Definitions (gRPC)

The core microservice interfaces are defined in Protocol Buffers (proto3):

```protobuf
syntax = "proto3";

package billvyom.services.accounting.v1;

option go_package = "github.com/billvyom/core/packages/contracts/accounting/v1;accountingv1";

service FinancialPostingService {
  rpc CreateJournalEntry (CreateJournalEntryRequest) returns (CreateJournalEntryResponse);
}

message CreateJournalEntryRequest {
  string tenant_id = 1;
  string branch_id = 2;
  string entry_number = 3;
  string entry_date = 4;
  string narration = 5;
  repeated JournalLine lines = 6;
}

message JournalLine {
  string account_id = 1;
  string debit_amount = 2;  // High precision parsed string representation
  string credit_amount = 3; // High precision parsed string representation
  string memo = 4;
}

message CreateJournalEntryResponse {
  bool success = 1;
  string journal_entry_id = 2;
  string tracking_number = 3;
}
```
