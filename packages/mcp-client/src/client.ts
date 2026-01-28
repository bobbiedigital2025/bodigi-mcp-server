import {
  MCPClientConfig,
  Tool,
  ToolCallResult,
  JobResult
} from './types.js';
import { SecurityValidator } from './security.js';
import { AuditLogger } from './audit-logger.js';

/**
 * MCP Client SDK
 * Lightweight client for connecting to BoDiGi MCP Server from any Node/TS application
 */
export class MCPClient {
  private config: Required<MCPClientConfig>;
  private security: SecurityValidator;
  private auditLogger: AuditLogger;

  constructor(config: MCPClientConfig) {
    // Set defaults
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '',
      oauthToken: config.oauthToken || '',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableAuditLog: config.enableAuditLog !== false,
      allowlist: config.allowlist || []
    };

    // Validate authentication
    if (!this.config.apiKey && !this.config.oauthToken) {
      throw new Error('Either apiKey or oauthToken must be provided for authentication');
    }

    // Initialize security and audit logging
    this.security = new SecurityValidator(this.config.allowlist);
    this.auditLogger = new AuditLogger(this.config.enableAuditLog);

    this.auditLogger.log('client_initialized', {
      baseUrl: this.config.baseUrl,
      authMethod: this.config.apiKey ? 'apiKey' : 'oauth'
    }, true);
  }

  /**
   * List all available tools from the MCP server
   */
  async listTools(): Promise<Tool[]> {
    this.auditLogger.log('list_tools', {}, true);

    try {
      const response = await this.makeRequest('POST', '/v1/tools/list', {});
      
      if (!response.tools || !Array.isArray(response.tools)) {
        throw new Error('Invalid response format: expected tools array');
      }

      this.auditLogger.log('list_tools_success', {
        toolCount: response.tools.length
      }, true);

      return response.tools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.auditLogger.log('list_tools_failed', {}, false, errorMessage);
      throw error;
    }
  }

  /**
   * Call a specific tool with parameters
   */
  async callTool(toolName: string, params: Record<string, any>): Promise<ToolCallResult> {
    // Security validation
    const toolValidation = this.security.validateToolName(toolName);
    if (!toolValidation.valid) {
      this.auditLogger.log('call_tool_blocked', {
        toolName,
        reason: toolValidation.error
      }, false, toolValidation.error);
      throw new Error(toolValidation.error);
    }

    const paramsValidation = this.security.validateParameters(params);
    if (!paramsValidation.valid) {
      this.auditLogger.log('call_tool_blocked', {
        toolName,
        reason: paramsValidation.error
      }, false, paramsValidation.error);
      throw new Error(paramsValidation.error);
    }

    this.auditLogger.log('call_tool', {
      toolName,
      params
    }, true);

    try {
      const response = await this.makeRequest('POST', '/v1/tools/call', {
        name: toolName,
        arguments: params
      });

      this.auditLogger.log('call_tool_success', {
        toolName
      }, true);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.auditLogger.log('call_tool_failed', {
        toolName,
        params
      }, false, errorMessage);
      throw error;
    }
  }

  /**
   * Run a job (batch operation or workflow)
   */
  async runJob(jobName: string, payload: Record<string, any>): Promise<JobResult> {
    // Validate job name
    const jobValidation = this.security.validateToolName(jobName);
    if (!jobValidation.valid) {
      this.auditLogger.log('run_job_blocked', {
        jobName,
        reason: jobValidation.error
      }, false, jobValidation.error);
      
      return {
        status: 'error',
        error: jobValidation.error
      };
    }

    // Validate payload
    const payloadValidation = this.security.validateParameters(payload);
    if (!payloadValidation.valid) {
      this.auditLogger.log('run_job_blocked', {
        jobName,
        reason: payloadValidation.error
      }, false, payloadValidation.error);
      
      return {
        status: 'error',
        error: payloadValidation.error
      };
    }

    this.auditLogger.log('run_job', {
      jobName,
      payload
    }, true);

    try {
      const response = await this.makeRequest('POST', '/v1/jobs/run', {
        job: jobName,
        payload
      });

      this.auditLogger.log('run_job_success', {
        jobName
      }, true);

      return {
        status: 'success',
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.auditLogger.log('run_job_failed', {
        jobName,
        payload
      }, false, errorMessage);

      return {
        status: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs() {
    return this.auditLogger.getLogs();
  }

  /**
   * Export audit logs
   */
  exportAuditLogs(): string {
    return this.auditLogger.export();
  }

  /**
   * Make an HTTP request with retry logic and timeout
   */
  private async makeRequest(
    method: string,
    path: string,
    body: any,
    attempt: number = 0
  ): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add authentication header
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      } else if (this.config.oauthToken) {
        headers['Authorization'] = `Bearer ${this.config.oauthToken}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }

      // Retry logic with exponential backoff
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        
        this.auditLogger.log('request_retry', {
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          delay
        }, true);

        await this.sleep(delay);
        return this.makeRequest(method, path, body, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
