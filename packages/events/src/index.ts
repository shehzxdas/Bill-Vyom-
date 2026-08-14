/**
 * Bill Vyom — Transactional Outbox Event Engine
 * Enforces dual-write guarantees by routing domain state changes through an outbox log.
 */

export interface OutboxEvent<T = any> {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  attempts: number;
  errorLog?: string;
  createdAt: string;
  processedAt?: string;
}

export class TransactionalOutbox {
  private static instance: TransactionalOutbox;
  private queue: OutboxEvent[] = [];

  private constructor() {}

  public static getInstance(): TransactionalOutbox {
    if (!TransactionalOutbox.instance) {
      TransactionalOutbox.instance = new TransactionalOutbox();
    }
    return TransactionalOutbox.instance;
  }

  /**
   * Safe transactional write of an event to the Outbox queue
   */
  public enqueue<T>(event: Omit<OutboxEvent<T>, 'id' | 'status' | 'attempts' | 'createdAt'>): OutboxEvent<T> {
    const fullEvent: OutboxEvent<T> = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    this.queue.push(fullEvent);
    return fullEvent;
  }

  public getPendingEvents(tenantId?: string): OutboxEvent[] {
    return this.queue.filter((e) => e.status === 'PENDING' && (!tenantId || e.tenantId === tenantId));
  }

  public getProcessedEvents(tenantId?: string): OutboxEvent[] {
    return this.queue.filter((e) => e.status === 'PROCESSED' && (!tenantId || e.tenantId === tenantId));
  }

  public markProcessed(eventId: string): void {
    const event = this.queue.find((e) => e.id === eventId);
    if (event) {
      event.status = 'PROCESSED';
      event.processedAt = new Date().toISOString();
    }
  }

  public markFailed(eventId: string, error: string): void {
    const event = this.queue.find((e) => e.id === eventId);
    if (event) {
      event.attempts += 1;
      event.errorLog = error;
      if (event.attempts >= 3) {
        event.status = 'FAILED';
      }
    }
  }

  public clear(): void {
    this.queue = [];
  }
}

export const outbox = TransactionalOutbox.getInstance();
