/**
 * Safety and Security Module for MCP Client
 * Implements allowlists, prevents RCE, and blocks unsafe operations
 */

export class SecurityValidator {
  private allowedToolNames: Set<string>;
  private allowedDomains: Set<string>;
  private blockedPatterns: RegExp[];

  constructor(customAllowlist?: string[]) {
    // Default allowed tool names
    this.allowedToolNames = new Set([
      'ai_teaching',
      'tool_discovery',
      'web_fetch',
      'knowledge_ingest',
      'lesson_quiz_gen',
      'bot_knowledge_update'
    ]);

    // Add custom allowlist if provided
    if (customAllowlist) {
      customAllowlist.forEach(tool => this.allowedToolNames.add(tool));
    }

    // Allowed domains for web operations
    this.allowedDomains = new Set([
      'wikipedia.org',
      'github.com',
      'docs.',
      'api.',
      '.edu',
      '.gov'
    ]);

    // Patterns that indicate potential security risks
    this.blockedPatterns = [
      /eval\s*\(/i,
      /exec\s*\(/i,
      /spawn\s*\(/i,
      /require\s*\(['"]\s*child_process/i,
      /import\s+.*child_process/i,
      /\.\.\/\.\.\//,  // Path traversal
      /file:\/\//i,     // File protocol
      /javascript:/i,   // JavaScript protocol
      /data:.*base64/i, // Data URIs with base64
      /<script/i,       // Script tags
      /on\w+\s*=/i      // Event handlers
    ];
  }

  /**
   * Validate if a tool is allowed to be called
   */
  validateToolName(toolName: string): { valid: boolean; error?: string } {
    if (!this.allowedToolNames.has(toolName)) {
      return {
        valid: false,
        error: `Tool "${toolName}" is not in the allowlist. Allowed tools: ${Array.from(this.allowedToolNames).join(', ')}`
      };
    }
    return { valid: true };
  }

  /**
   * Validate tool parameters for security risks
   */
  validateParameters(params: any): { valid: boolean; error?: string } {
    const stringified = JSON.stringify(params);

    // Check for blocked patterns (potential RCE)
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(stringified)) {
        return {
          valid: false,
          error: `Parameters contain potentially unsafe patterns. Remote code execution is not allowed.`
        };
      }
    }

    // Check for URL parameters and validate domains
    if (params.url) {
      const urlValidation = this.validateUrl(params.url);
      if (!urlValidation.valid) {
        return urlValidation;
      }
    }

    // Check for repository cloning attempts
    if (params.repository || params.repo || params.clone) {
      return {
        valid: false,
        error: 'Repository cloning and running unknown code is not allowed for security reasons.'
      };
    }

    return { valid: true };
  }

  /**
   * Validate URL against allowlist
   */
  private validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check if domain is allowed
      const isAllowed = Array.from(this.allowedDomains).some(domain => {
        return hostname.includes(domain) || hostname.endsWith(domain);
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `URL domain "${hostname}" is not in the allowlist. Only approved domains are allowed.`
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Add a tool to the allowlist
   */
  addToAllowlist(toolName: string): void {
    this.allowedToolNames.add(toolName);
  }

  /**
   * Remove a tool from the allowlist
   */
  removeFromAllowlist(toolName: string): void {
    this.allowedToolNames.delete(toolName);
  }
}
