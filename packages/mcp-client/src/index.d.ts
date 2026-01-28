/**
 * @bodigi/mcp-client
 * Lightweight Node/TS client SDK for BoDiGi MCP Server
 *
 * This client provides a simple, secure way to connect to the BoDiGi MCP Server
 * from any Node.js or TypeScript application.
 *
 * Features:
 * - API Key and OAuth authentication
 * - Automatic retries with exponential backoff
 * - Request timeout handling
 * - Security allowlists and validation
 * - Audit logging
 * - Type-safe API
 *
 * @example
 * ```typescript
 * import { MCPClient } from '@bodigi/mcp-client';
 *
 * const client = new MCPClient({
 *   baseUrl: 'https://mcp.bodigi.com',
 *   apiKey: process.env.BODIGI_API_KEY
 * });
 *
 * // List available tools
 * const tools = await client.listTools();
 *
 * // Call a tool
 * const result = await client.callTool('ai_teaching', {
 *   topic: 'JavaScript Promises',
 *   level: 'intermediate'
 * });
 * ```
 */
export { MCPClient } from './client.js';
export { SecurityValidator } from './security.js';
export { AuditLogger } from './audit-logger.js';
export type { MCPClientConfig, Tool, ToolCallResult, JobResult, AuditLogEntry } from './types.js';
//# sourceMappingURL=index.d.ts.map