import { z } from 'zod';
import { loadAllManifests } from './manifest-loader.js';

/**
 * Tool Needs Analyzer
 * Analyzes application requirements and recommends appropriate tools
 */

export const needsAnalyzerSchema = z.object({
  app_name: z.string().describe('The name of the application'),
  app_description: z.string().describe('Description of what the application does'),
  requested_capabilities: z.array(z.string()).describe('List of capabilities the application needs')
});

export type NeedsAnalyzerInput = z.infer<typeof needsAnalyzerSchema>;

interface AnalysisResult {
  recommended_tools: Array<{
    name: string;
    reason: string;
    capabilities_matched: string[];
    risk_level: string;
  }>;
  missing_capabilities: string[];
}

/**
 * Analyze app requirements and recommend tools
 */
export async function executeNeedsAnalyzer(input: NeedsAnalyzerInput): Promise<string> {
  const { app_name, app_description, requested_capabilities } = input;
  
  // Load all tool manifests
  const manifests = loadAllManifests();
  
  // Check if manifests loaded successfully
  if (manifests.size === 0) {
    return `# ⚠️ System Error\n\nNo tool manifests could be loaded. The tool needs analysis system requires properly configured manifests.\n\nPlease contact the system administrator.`;
  }
  
  const result: AnalysisResult = {
    recommended_tools: [],
    missing_capabilities: []
  };
  
  // Track which capabilities have been matched
  const matchedCapabilities = new Set<string>();
  
  // Analyze each tool against requested capabilities
  for (const [toolName, manifest] of manifests.entries()) {
    if (!manifest.enabled) {
      continue;
    }
    
    const matchedCaps = new Set<string>();
    
    // Check for exact and partial capability matches
    for (const requestedCap of requested_capabilities) {
      const requestedLower = requestedCap.toLowerCase();
      let capMatched = false;
      
      for (const toolCap of manifest.capabilities) {
        const toolCapLower = toolCap.toLowerCase();
        
        // Check for exact match or if one contains the other
        if (requestedLower === toolCapLower || 
            requestedLower.includes(toolCapLower.replace(/_/g, ' ')) ||
            toolCapLower.includes(requestedLower.replace(/ /g, '_'))) {
          matchedCaps.add(requestedCap);
          matchedCapabilities.add(requestedCap);
          capMatched = true;
          break; // Found a match, no need to check other tool capabilities
        }
      }
      
      // If no direct capability match, check category and description
      if (!capMatched) {
        const categoryMatch = manifest.category.toLowerCase().includes(requestedLower) ||
                             requestedLower.includes(manifest.category.toLowerCase());
        const descMatch = manifest.description.toLowerCase().includes(requestedLower);
        
        if (categoryMatch || descMatch) {
          matchedCaps.add(requestedCap);
          matchedCapabilities.add(requestedCap);
        }
      }
    }
    
    // If this tool matches any capabilities, recommend it
    if (matchedCaps.size > 0) {
      // Find the highest risk level (assuming risks are ordered from highest to lowest)
      const highestRisk = manifest.risks.length > 0 ? manifest.risks[0] : 'none';
      
      result.recommended_tools.push({
        name: toolName,
        reason: `Provides ${matchedCaps.size} matching capability(ies): ${manifest.description}`,
        capabilities_matched: Array.from(matchedCaps),
        risk_level: highestRisk
      });
    }
  }
  
  // Identify missing capabilities
  for (const requested of requested_capabilities) {
    if (!matchedCapabilities.has(requested)) {
      result.missing_capabilities.push(requested);
    }
  }
  
  // Format output
  let output = `# Tool Needs Analysis for "${app_name}"\n\n`;
  output += `**App Description:** ${app_description}\n\n`;
  output += `**Requested Capabilities:** ${requested_capabilities.length}\n\n`;
  
  if (result.recommended_tools.length > 0) {
    output += `## 🎯 Recommended Tools (${result.recommended_tools.length})\n\n`;
    
    for (const tool of result.recommended_tools) {
      output += `### ${tool.name}\n`;
      output += `- **Reason:** ${tool.reason}\n`;
      output += `- **Capabilities Matched:** ${tool.capabilities_matched.join(', ')}\n`;
      output += `- **Risk Level:** ${tool.risk_level}\n\n`;
    }
  } else {
    output += `## ⚠️ No Matching Tools Found\n\n`;
    output += `No existing tools match your requested capabilities.\n\n`;
  }
  
  if (result.missing_capabilities.length > 0) {
    output += `## ❌ Missing Capabilities (${result.missing_capabilities.length})\n\n`;
    output += `The following capabilities are not available in any existing tools:\n\n`;
    
    for (const cap of result.missing_capabilities) {
      output += `- ${cap}\n`;
    }
    
    output += `\n**Recommendation:** You may need to develop custom tools for these capabilities.\n`;
    output += `See the documentation on "How to Add a Tool Safely" for guidance.\n`;
  } else {
    output += `## ✅ All Capabilities Covered\n\n`;
    output += `All requested capabilities are available through the recommended tools.\n`;
  }
  
  return output;
}

export const needsAnalyzerTool = {
  name: 'needs_analyzer',
  description: 'Analyzes application requirements and recommends appropriate MCP tools. Helps identify which tools to enable and which capabilities are missing.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_name: {
        type: 'string',
        description: 'The name of the application'
      },
      app_description: {
        type: 'string',
        description: 'Description of what the application does'
      },
      requested_capabilities: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'List of capabilities the application needs'
      }
    },
    required: ['app_name', 'app_description', 'requested_capabilities']
  }
};
