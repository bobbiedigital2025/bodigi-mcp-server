import { AuditLogEntry } from './types.js';
/**
 * Audit Logger for tracking all operations
 * Provides transparency and security monitoring
 */
export declare class AuditLogger {
    private logs;
    private enabled;
    constructor(enabled?: boolean);
    /**
     * Log an operation
     */
    log(operation: string, details: Record<string, any>, success: boolean, error?: string): void;
    /**
     * Get all audit logs
     */
    getLogs(): AuditLogEntry[];
    /**
     * Get logs for a specific operation
     */
    getLogsByOperation(operation: string): AuditLogEntry[];
    /**
     * Get failed operations
     */
    getFailedOperations(): AuditLogEntry[];
    /**
     * Clear all logs
     */
    clear(): void;
    /**
     * Export logs as JSON string
     */
    export(): string;
}
//# sourceMappingURL=audit-logger.d.ts.map