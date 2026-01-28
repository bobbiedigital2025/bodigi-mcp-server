/**
 * Audit Logger for tracking all operations
 * Provides transparency and security monitoring
 */
export class AuditLogger {
    logs = [];
    enabled;
    constructor(enabled = true) {
        this.enabled = enabled;
    }
    /**
     * Log an operation
     */
    log(operation, details, success, error) {
        if (!this.enabled) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            operation,
            details,
            success,
            error
        };
        this.logs.push(entry);
        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('[AUDIT]', entry);
        }
    }
    /**
     * Get all audit logs
     */
    getLogs() {
        return [...this.logs];
    }
    /**
     * Get logs for a specific operation
     */
    getLogsByOperation(operation) {
        return this.logs.filter(log => log.operation === operation);
    }
    /**
     * Get failed operations
     */
    getFailedOperations() {
        return this.logs.filter(log => !log.success);
    }
    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
    }
    /**
     * Export logs as JSON string
     */
    export() {
        return JSON.stringify(this.logs, null, 2);
    }
}
//# sourceMappingURL=audit-logger.js.map