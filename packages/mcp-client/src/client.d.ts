import { MCPClientConfig, Tool, ToolCallResult, JobResult } from './types.js';
/**
 * MCP Client SDK
 * Lightweight client for connecting to BoDiGi MCP Server from any Node/TS application
 */
export declare class MCPClient {
    private config;
    private security;
    private auditLogger;
    constructor(config: MCPClientConfig);
    /**
     * List all available tools from the MCP server
     */
    listTools(): Promise<Tool[]>;
    /**
     * Call a specific tool with parameters
     */
    callTool(toolName: string, params: Record<string, any>): Promise<ToolCallResult>;
    /**
     * Run a job (batch operation or workflow)
     */
    runJob(jobName: string, payload: Record<string, any>): Promise<JobResult>;
    /**
     * Get audit logs
     */
    getAuditLogs(): import("./types.js").AuditLogEntry[];
    /**
     * Export audit logs
     */
    exportAuditLogs(): string;
    /**
     * Make an HTTP request with retry logic and timeout
     */
    private makeRequest;
    /**
     * Sleep utility for retry backoff
     */
    private sleep;
}
//# sourceMappingURL=client.d.ts.map