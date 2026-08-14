/**
 * Bill Vyom — Concurrency Safeguard & Request Idempotency Engine
 * Prevents double-submissions, double-billings, or duplicate ledger entries on rapid retries.
 */

export interface IdempotentRecord {
  key: string;
  tenantId: string;
  userId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  responsePayload?: any;
  responseStatus?: number;
  createdAt: string;
}

export class IdempotencyRegistry {
  private static instance: IdempotencyRegistry;
  private records: Map<string, IdempotentRecord> = new Map();

  private constructor() {}

  public static getInstance(): IdempotencyRegistry {
    if (!IdempotencyRegistry.instance) {
      IdempotencyRegistry.instance = new IdempotencyRegistry();
    }
    return IdempotencyRegistry.instance;
  }

  /**
   * Acquire a lock for an idempotency key.
   * Returns 'PROCESSING' if lock is acquired, or existing record if already cached/in-flight.
   */
  public acquire(key: string, tenantId: string, userId: string): IdempotentRecord {
    const fullKey = `${tenantId}:${key}`;
    const existing = this.records.get(fullKey);

    if (existing) {
      return existing;
    }

    const newRecord: IdempotentRecord = {
      key,
      tenantId,
      userId,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
    };

    this.records.set(fullKey, newRecord);
    return newRecord;
  }

  /**
   * Cache the final completed response payload.
   */
  public resolve(key: string, tenantId: string, status: number, payload: any): void {
    const fullKey = `${tenantId}:${key}`;
    const record = this.records.get(fullKey);
    if (record) {
      record.status = 'COMPLETED';
      record.responseStatus = status;
      record.responsePayload = payload;
    }
  }

  /**
   * Mark execution as failed so client can retry safely.
   */
  public fail(key: string, tenantId: string): void {
    const fullKey = `${tenantId}:${key}`;
    const record = this.records.get(fullKey);
    if (record) {
      record.status = 'FAILED';
    }
  }

  public clear(): void {
    this.records.clear();
  }
}

export const idempotency = IdempotencyRegistry.getInstance();
export default idempotency;
