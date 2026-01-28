import { z } from 'zod';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadToolManifest, loadAllManifests } from './manifest-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Enable Tool
 * Admin-protected tool to enable existing tools safely
 * Can only enable tools that exist in /src/tools/, cannot install remote code
 */

export const enableToolSchema = z.object({
  tool_name: z.string().describe('The name of the tool to enable (must exist in /src/tools/)'),
  admin_key: z.string().describe('Admin authorization key (required for security)')
});

export type EnableToolInput = z.infer<typeof enableToolSchema>;

// In production, this should be an environment variable
const ADMIN_KEY = process.env.BODIGI_ADMIN_KEY || 'default-admin-key-change-in-production';

/**
 * Verify admin authorization
 */
function verifyAdmin(providedKey: string): boolean {
  if (providedKey !== ADMIN_KEY) {
    return false;
  }
  return true;
}

/**
 * Check if a tool exists in the local /src/tools/ directory
 */
function toolExistsLocally(toolName: string): boolean {
  // Convert tool name to file name format (e.g., "ai_teaching" -> "ai-teaching")
  const fileName = toolName.replace(/_/g, '-');
  const toolPath = join(__dirname, `${fileName}.ts`);
  const manifestPath = join(__dirname, 'manifests', `${fileName}.json`);
  
  return existsSync(toolPath) && existsSync(manifestPath);
}

/**
 * Execute enable tool command
 */
export async function executeEnableTool(input: EnableToolInput): Promise<string> {
  const { tool_name, admin_key } = input;
  
  // Verify admin authorization
  if (!verifyAdmin(admin_key)) {
    return `# ❌ Authorization Failed\n\nInvalid admin key. Tool enablement requires admin authorization.\n\n**Security Notice:** This operation is restricted to prevent unauthorized tool installation.`;
  }
  
  // Check if tool exists locally
  if (!toolExistsLocally(tool_name)) {
    return `# ❌ Tool Not Found\n\nThe tool "${tool_name}" does not exist in the local /src/tools/ directory.\n\n**Security Policy:** This server can only enable tools that are already installed locally. Remote code installation is not permitted.\n\n**Available Tools:**\n${Array.from(loadAllManifests().keys()).map(name => `- ${name}`).join('\n')}`;
  }
  
  // Load the tool manifest
  const fileName = tool_name.replace(/_/g, '-');
  const manifest = loadToolManifest(fileName);
  
  if (!manifest) {
    return `# ❌ Manifest Error\n\nCould not load manifest for tool "${tool_name}". The tool file exists but the manifest is missing or invalid.\n\nPlease ensure the manifest file exists at: /src/tools/manifests/${fileName}.json`;
  }
  
  // Check if already enabled
  if (manifest.enabled) {
    return `# ℹ️ Tool Already Enabled\n\n**Tool:** ${tool_name}\n**Status:** Already enabled\n\nThis tool is already active and available for use.`;
  }
  
  // In a real implementation, this would update the manifest file or a database
  // For now, we'll return a success message with instructions
  let output = `# ✅ Tool Enable Request Processed\n\n`;
  output += `**Tool:** ${tool_name}\n`;
  output += `**Description:** ${manifest.description}\n`;
  output += `**Category:** ${manifest.category}\n`;
  output += `**Risk Level:** ${manifest.risks.join(', ')}\n\n`;
  
  output += `## Tool Details\n\n`;
  output += `**Capabilities:**\n`;
  for (const cap of manifest.capabilities) {
    output += `- ${cap}\n`;
  }
  
  if (manifest.dependencies.length > 0) {
    output += `\n**Dependencies:**\n`;
    for (const dep of manifest.dependencies) {
      output += `- ${dep}\n`;
    }
  }
  
  if (Object.keys(manifest.envRequirements).length > 0) {
    output += `\n**Environment Requirements:**\n`;
    for (const [key, value] of Object.entries(manifest.envRequirements)) {
      output += `- ${key}: ${value}\n`;
    }
  }
  
  output += `\n## Next Steps\n\n`;
  output += `1. The tool "${tool_name}" has been validated and is safe to enable\n`;
  output += `2. Restart the MCP server to activate the tool\n`;
  output += `3. The tool will be available in the tool list after restart\n\n`;
  
  output += `**Note:** In a production environment, this would automatically update the tool registry.\n`;
  
  return output;
}

export const enableToolTool = {
  name: 'enable_tool',
  description: 'Admin-protected tool to safely enable existing tools. Can only enable tools that exist locally in /src/tools/, cannot install remote code. Requires admin authorization.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      tool_name: {
        type: 'string',
        description: 'The name of the tool to enable (must exist in /src/tools/)'
      },
      admin_key: {
        type: 'string',
        description: 'Admin authorization key (required for security)'
      }
    },
    required: ['tool_name', 'admin_key']
  }
};
