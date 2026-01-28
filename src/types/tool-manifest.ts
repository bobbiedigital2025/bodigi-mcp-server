/**
 * Tool Manifest Types
 * Defines the structure for tool metadata and capabilities
 */

export interface ToolManifest {
  name: string;
  description: string;
  category: 'learning' | 'automation' | 'content' | 'security' | 'system';
  scopes: string[];
  risks: RiskLevel[];
  dependencies: string[];
  envRequirements: Record<string, string>;
  capabilities: string[];
  version: string;
  enabled: boolean;
}

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ToolRisk {
  level: RiskLevel;
  description: string;
  mitigation?: string;
}
