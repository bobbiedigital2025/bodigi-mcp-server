/**
 * Safety and Security Module for MCP Client
 * Implements allowlists, prevents RCE, and blocks unsafe operations
 */
export declare class SecurityValidator {
    private allowedToolNames;
    private allowedDomains;
    private blockedPatterns;
    constructor(customAllowlist?: string[]);
    /**
     * Validate if a tool is allowed to be called
     */
    validateToolName(toolName: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Validate tool parameters for security risks
     */
    validateParameters(params: any): {
        valid: boolean;
        error?: string;
    };
    /**
     * Validate URL against allowlist
     */
    private validateUrl;
    /**
     * Add a tool to the allowlist
     */
    addToAllowlist(toolName: string): void;
    /**
     * Remove a tool from the allowlist
     */
    removeFromAllowlist(toolName: string): void;
}
//# sourceMappingURL=security.d.ts.map