import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { config, validateConfig } from '../../packages/config/src/index';
import { API_ROUTES, successResponse, errorResponse } from '../../packages/contracts/src/index';
import { hasPermission, validateScope, SYSTEM_PERMISSIONS } from '../../packages/authorization/src/index';
import { validateEmail, validatePassword, validateBusinessName } from '../../packages/validation/src/index';
import { logger } from '../../packages/observability/src/index';
import { Money } from '../../packages/money/src/index';
import { outbox } from '../../packages/events/src/index';
import { idempotency } from '../../packages/idempotency/src/index';
import { LocalizationManager } from '../../packages/localization/src/index';

describe('Bill Vyom — Foundation Capabilities Test Suite', () => {
  before(() => {
    outbox.clear();
    idempotency.clear();
  });

  after(() => {
    outbox.clear();
    idempotency.clear();
  });

  test('1. Config Foundation Validation', () => {
    const expectedPort = parseInt(process.env.PORT || '3000', 10);
    assert.strictEqual(config.port, expectedPort);
    assert.ok(config.jwtSecret.length > 0);
    // Ensure no throw on validation call
    assert.doesNotThrow(() => validateConfig());
  });

  test('2. Shared Contracts API Route Constants', () => {
    assert.strictEqual(API_ROUTES.health, '/api/health');
    assert.strictEqual(API_ROUTES.auth.login, '/api/v1/auth/login');

    const successPayload = successResponse({ data: 'ok' });
    assert.strictEqual(successPayload.success, true);
    assert.ok(successPayload.timestamp);

    const errorPayload = errorResponse('ERR_CODE', 'Error Message', 'test_field');
    assert.strictEqual(errorPayload.success, false);
    assert.strictEqual(errorPayload.errors?.[0].code, 'ERR_CODE');
    assert.strictEqual(errorPayload.errors?.[0].field, 'test_field');
  });

  test('3. Authorization/RBAC Scope Rules', () => {
    // Owner bypass check
    assert.strictEqual(hasPermission(['OWNER'], SYSTEM_PERMISSIONS.SETTINGS_EDIT), true);
    // Non-permitted cashier check
    assert.strictEqual(hasPermission(['CASHIER'], SYSTEM_PERMISSIONS.SETTINGS_EDIT), false);
    // Store manager checking product view
    assert.strictEqual(hasPermission(['STORE_MANAGER'], SYSTEM_PERMISSIONS.PRODUCT_CREATE), true);

    // Scope validation
    assert.strictEqual(validateScope(['*'], 'any_scope'), true);
    assert.strictEqual(validateScope(['read'], 'read'), true);
    assert.strictEqual(validateScope(['read'], 'write'), false);
  });

  test('4. Input Validation Primitives', () => {
    // Email
    assert.strictEqual(validateEmail('test@vyom.global').isValid, true);
    assert.strictEqual(validateEmail('invalid-email').isValid, false);

    // Password
    assert.strictEqual(validatePassword('StrongPass123!').isValid, true);
    assert.strictEqual(validatePassword('weak').isValid, false);

    // Business Name
    assert.strictEqual(validateBusinessName('Acme Inc').isValid, true);
    assert.strictEqual(validateBusinessName('Ac').isValid, false);
  });

  test('5. Observability Correlation ID Trace', () => {
    const id1 = logger.getCorrelationId();
    assert.ok(id1.startsWith('tx_'));

    const id2 = logger.getCorrelationId();
    assert.strictEqual(id1, id2); // correlation ID persists in active scope

    logger.generateCorrelationId();
    const id3 = logger.getCorrelationId();
    assert.notStrictEqual(id1, id3); // newly generated differs
  });

  test('6. Monetary Precision & Exchange Scale', () => {
    const m1 = new Money('100.00', 'INR');
    const m2 = new Money('50.00', 'INR');

    // Addition
    const added = m1.add(m2);
    assert.strictEqual(added.getAmount(), '150.00');

    // Factor Multiplication
    const multiplied = m1.mul('2.5');
    assert.strictEqual(multiplied.getAmount(), '250.00');

    // Exchange Rate Conversion (INR to USD with rate 0.012)
    const converted = m1.convert('0.012', 'USD');
    assert.strictEqual(converted.getAmount(), '1.20');
    assert.strictEqual(converted.getCurrencyCode(), 'USD');
  });

  test('7. Outbox Resiliency Flow', () => {
    const originalPendingCount = outbox.getPendingEvents().length;
    
    // Enqueue
    const evt = outbox.enqueue({
      tenantId: 'tn_test_1',
      eventType: 'CUSTOMER.CREATED',
      aggregateType: 'customer',
      aggregateId: 'cust_001',
      payload: { code: 'CUST-001' },
    });

    assert.strictEqual(outbox.getPendingEvents().length, originalPendingCount + 1);
    assert.strictEqual(evt.status, 'PENDING');

    // Process
    outbox.markProcessed(evt.id);
    assert.strictEqual(outbox.getPendingEvents().length, originalPendingCount);
    assert.strictEqual(outbox.getProcessedEvents().length, 1);
  });

  test('8. Request Idempotency Registry Concurrency', () => {
    const key = 'test_idemp_key';
    const tenantId = 'tn_test_1';
    const userId = 'usr_test_1';

    // First acquire (Should lock and register PROCESSING)
    const record1 = idempotency.acquire(key, tenantId, userId);
    assert.strictEqual(record1.status, 'PROCESSING');

    // Second acquire (Should return existing PROCESSING)
    const record2 = idempotency.acquire(key, tenantId, userId);
    assert.strictEqual(record2.status, 'PROCESSING');

    // Resolve
    idempotency.resolve(key, tenantId, 201, { doc: 'created' });
    const record3 = idempotency.acquire(key, tenantId, userId);
    assert.strictEqual(record3.status, 'COMPLETED');
    assert.deepStrictEqual(record3.responsePayload, { doc: 'created' });
    assert.strictEqual(record3.responseStatus, 201);
  });

  test('9. Localization & Internationalization Foundation', () => {
    const loc = new LocalizationManager('en-US');
    assert.strictEqual(loc.getLocale(), 'en-US');
    assert.strictEqual(loc.getTimezone(), 'America/New_York');

    const formattedDate = loc.formatDate(new Date('2026-08-13T10:00:00Z'));
    assert.ok(formattedDate.length > 0);

    const formattedNum = loc.formatNumber(1250.5);
    assert.strictEqual(formattedNum.includes('1,250.5'), true);

    const formattedCurr = loc.formatCurrency(1250.5, 'USD');
    assert.strictEqual(formattedCurr.includes('$1,250.50'), true);
  });
});
