/**
 * Types for the MCP Client SDK
 */

export interface MCPClientConfig {
  /** Base URL of the MCP server */
  baseUrl: string;
  
  /** API key for authentication (if using API key auth) */
  apiKey?: string;
  
  /** OAuth token for authentication (if using OAuth) */
  oauthToken?: string;
  
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
  
  /** Enable audit logging (default: true) */
  enableAuditLog?: boolean;
  
  /** Custom allowlist for operations (if not set, uses default) */
  allowlist?: string[];
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface ToolCallResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface JobResult {
  status: 'success' | 'error';
  data?: any;
  error?: string;
}

export interface AuditLogEntry {
  timestamp: string;
  operation: string;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}
