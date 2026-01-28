import { AuditLogEntry } from './types.js';

/**
 * Audit Logger for tracking all operations
 * Provides transparency and security monitoring
 */
export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private enabled: boolean;
  private maxLogSize: number;

  constructor(enabled: boolean = true, maxLogSize: number = 1000) {
    this.enabled = enabled;
    this.maxLogSize = maxLogSize;
  }

  /**
   * Log an operation
   */
  log(
    operation: string,
    details: Record<string, any>,
    success: boolean,
    error?: string
  ): void {
    if (!this.enabled) {
      return;
    }

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      success,
      error
    };

    this.logs.push(entry);

    // Implement log rotation to prevent memory leaks
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift(); // Remove oldest entry
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT]', entry);
    }
  }

  /**
   * Get all audit logs
   */
  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific operation
   */
  getLogsByOperation(operation: string): AuditLogEntry[] {
    return this.logs.filter(log => log.operation === operation);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): AuditLogEntry[] {
    return this.logs.filter(log => !log.success);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
