import { z } from 'zod';

/**
 * Tool Discovery
 * Enables applications to discover available tools and their capabilities
 */

export const toolDiscoverySchema = z.object({
  category: z.enum(['learning', 'automation', 'content', 'all']).optional().describe('Filter tools by category'),
  search: z.string().optional().describe('Search term to filter tools')
});

export type ToolDiscoveryInput = z.infer<typeof toolDiscoverySchema>;

interface ToolInfo {
  name: string;
  category: string;
  description: string;
  capabilities: string[];
}

const availableTools: ToolInfo[] = [
  {
    name: 'ai_teaching',
    category: 'learning',
    description: 'Adaptive AI teaching for personalized learning',
    capabilities: ['Beginner/Intermediate/Advanced levels', 'Multiple teaching formats', 'Topic-based instruction']
  },
  {
    name: 'tool_discovery',
    category: 'automation',
    description: 'Discover and explore available MCP tools',
    capabilities: ['Category filtering', 'Search functionality', 'Capability listing']
  },
  {
    name: 'web_fetch',
    category: 'content',
    description: 'Controlled web content fetching with safety checks',
    capabilities: ['URL validation', 'Content extraction', 'Rate limiting']
  },
  {
    name: 'knowledge_ingest',
    category: 'learning',
    description: 'Daily knowledge ingestion and processing',
    capabilities: ['Multi-source ingestion', 'Content summarization', 'Knowledge base updates']
  },
  {
    name: 'lesson_quiz_gen',
    category: 'learning',
    description: 'Generate lessons and quizzes automatically',
    capabilities: ['Lesson creation', 'Quiz generation', 'Difficulty adjustment']
  },
  {
    name: 'bot_knowledge_update',
    category: 'automation',
    description: 'Update bot knowledge bases with new information',
    capabilities: ['Knowledge validation', 'Version control', 'Incremental updates']
  }
];

export async function executeToolDiscovery(input: ToolDiscoveryInput): Promise<string> {
  const { category = 'all', search } = input;
  
  let filteredTools = availableTools;
  
  // Filter by category
  if (category !== 'all') {
    filteredTools = filteredTools.filter(tool => tool.category === category);
  }
  
  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    filteredTools = filteredTools.filter(tool => 
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.capabilities.some(cap => cap.toLowerCase().includes(searchLower))
    );
  }
  
  // Format results
  const results = filteredTools.map(tool => 
    `### ${tool.name} (${tool.category})\n${tool.description}\n\nCapabilities:\n${tool.capabilities.map(cap => `- ${cap}`).join('\n')}`
  ).join('\n\n---\n\n');
  
  return `# Available Tools (${filteredTools.length})\n\n${results || 'No tools found matching your criteria.'}`;
}

export const toolDiscoveryTool = {
  name: 'tool_discovery',
  description: 'Discover available MCP tools and their capabilities. Helps applications understand what functionality is available.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        enum: ['learning', 'automation', 'content', 'all'],
        description: 'Filter tools by category (optional)'
      },
      search: {
        type: 'string',
        description: 'Search term to filter tools (optional)'
      }
    }
  }
};
