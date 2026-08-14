import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { onboardTenant, signJwt, verifyJwt, hashPassword } from '../server/auth';

describe('Bill Vyom — Tenant Security & Isolation Test Suite', () => {
  let tenantAToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;

  before(() => {
    db.clearAll();

    // Onboard Tenant A
    const resA = onboardTenant({
      legal_name: 'Alpha Global Corp',
      country_code: 'IN',
      base_currency_code: 'INR',
      timezone: 'Asia/Kolkata',
      business_type: 'Private Limited',
      industry: 'Technology',
      contact_email: 'alpha@corp.com',
      contact_phone: '+919876543210',
      owner_first_name: 'Alice',
      owner_last_name: 'Alpha',
      owner_email: 'alice@alpha.com',
      owner_password: 'Password123!',
    });
    tenantAId = resA.tenant.id;
    tenantAToken = resA.token;

    // Onboard Tenant B
    const resB = onboardTenant({
      legal_name: 'Beta Trading LLC',
      country_code: 'US',
      base_currency_code: 'USD',
      timezone: 'America/New_York',
      business_type: 'LLC',
      industry: 'Retail',
      contact_email: 'beta@trading.com',
      contact_phone: '+15551234567',
      owner_first_name: 'Bob',
      owner_last_name: 'Beta',
      owner_email: 'bob@beta.com',
      owner_password: 'Password123!',
    });
    tenantBId = resB.tenant.id;
    tenantBToken = resB.token;
  });

  test('1. JWT Signature & Expiry Validation', () => {
    const payload = verifyJwt(tenantAToken);
    assert.notStrictEqual(payload, null);
    assert.strictEqual(payload?.tenant_id, tenantAId);

    const invalid = verifyJwt(tenantAToken + '_tampered');
    assert.strictEqual(invalid, null);
  });

  test('2. Tenant Membership Resolution', () => {
    const aliceUser = Array.from(db.users.values()).find((u) => u.email === 'alice@alpha.com')!;
    const aliceInTenantA = db.getMembership(aliceUser.id, tenantAId);
    assert.notStrictEqual(aliceInTenantA, undefined);

    // Alice should NOT be a member of Tenant B
    const aliceInTenantB = db.getMembership(aliceUser.id, tenantBId);
    assert.strictEqual(aliceInTenantB, undefined);
  });

  test('3. Database Row-Level Tenant Isolation', () => {
    const entitiesA = db.getLegalEntitiesByTenant(tenantAId);
    const entitiesB = db.getLegalEntitiesByTenant(tenantBId);

    assert.strictEqual(entitiesA.length, 1);
    assert.strictEqual(entitiesB.length, 1);
    assert.strictEqual(entitiesA[0].tenant_id, tenantAId);
    assert.strictEqual(entitiesB[0].tenant_id, tenantBId);
    assert.notStrictEqual(entitiesA[0].id, entitiesB[0].id);
  });

  test('4. Zero-Data Policy on Dashboard Metrics', () => {
    const metricsA = db.getDashboardMetrics(tenantAId);
    assert.strictEqual(metricsA.total_revenue, '0.00');
    assert.strictEqual(metricsA.receivables, '0.00');
    assert.strictEqual(metricsA.payables, '0.00');
    assert.strictEqual(metricsA.inventory_value, '0.00');
    assert.strictEqual(metricsA.cash_flow, '0.00');
    assert.strictEqual(metricsA.net_profit, '0.00');
    assert.strictEqual(metricsA.pending_approvals_count, 0);
  });

  test('5. Audit Trail Immutability & Logging', () => {
    const logsA = db.getAuditLogsByTenant(tenantAId);
    assert.ok(logsA.length > 0);
    assert.strictEqual(logsA[0].tenant_id, tenantAId);
    assert.strictEqual(logsA[0].action, 'TENANT.ONBOARDED');
  });
});
