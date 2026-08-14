/**
 * Bill Vyom — Authoritative Observability & Tracing Engine
 * Standardizes correlation ID propagation, audit payload construction, and telemetry logs.
 */

import crypto from 'crypto';

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  correlationId?: string;
  context?: Record<string, any>;
}

class ObservabilityManager {
  private activeCorrelationId: string | null = null;

  public generateCorrelationId(): string {
    const id = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.activeCorrelationId = id;
    return id;
  }

  public getCorrelationId(): string {
    if (!this.activeCorrelationId) {
      return this.generateCorrelationId();
    }
    return this.activeCorrelationId;
  }

  public clearCorrelationId(): void {
    this.activeCorrelationId = null;
  }

  private writeLog(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.getCorrelationId(),
      context,
    };
    
    // In production, this would stream to structured JSON collectors like Cloud Logging.
    if (process.env.NODE_ENV !== 'test') {
      const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
      console.log(`${color}[${entry.timestamp}] [${level.toUpperCase()}] [CID: ${entry.correlationId}] ${message}\x1b[0m`, context ? JSON.stringify(context) : '');
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    this.writeLog('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.writeLog('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.writeLog('error', message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.writeLog('debug', message, context);
  }
}

export const logger = new ObservabilityManager();
export default logger;
