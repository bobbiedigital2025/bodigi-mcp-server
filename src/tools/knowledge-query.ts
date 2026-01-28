import { z } from 'zod';
import { knowledgeDb } from '../db/index.js';
import { getLogger } from '../utils/logger.js';

/**
 * Knowledge Query Tool
 * Search and retrieve knowledge from the database
 */

const logger = getLogger();

export const knowledgeQuerySchema = z.object({
  category: z.string().optional().describe('Filter by category'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
  keyword: z.string().optional().describe('Search keyword in title/content'),
  limit: z.number().min(1).max(100).optional().describe('Maximum results to return')
});

export type KnowledgeQueryInput = z.infer<typeof knowledgeQuerySchema>;

export async function executeKnowledgeQuery(input: KnowledgeQueryInput): Promise<string> {
  const { category, priority, keyword, limit = 20 } = input;
  
  logger.info({ category, priority, keyword, limit }, 'Querying knowledge base');
  
  // Search database
  const results = knowledgeDb.search({ category, priority, keyword, limit });
  
  if (results.length === 0) {
    return `# No Knowledge Found\n\nNo results matched your query:\n- Category: ${category || 'any'}\n- Priority: ${priority || 'any'}\n- Keyword: ${keyword || 'none'}\n\nTry adjusting your search criteria.`;
  }
  
  // Format results
  let output = `# Knowledge Query Results\n\n**Found ${results.length} item(s)**\n`;
  
  if (category) output += `**Category**: ${category}\n`;
  if (priority) output += `**Priority**: ${priority}\n`;
  if (keyword) output += `**Keyword**: ${keyword}\n`;
  
  output += '\n---\n\n';
  
  results.forEach((item, index) => {
    const preview = item.content.length > 300 
      ? item.content.substring(0, 300) + '...' 
      : item.content;
    
    output += `## ${index + 1}. ${item.title}\n\n`;
    output += `- **ID**: ${item.id}\n`;
    output += `- **Category**: ${item.category}\n`;
    output += `- **Priority**: ${item.priority}\n`;
    output += `- **Source**: ${item.source_url}\n`;
    output += `- **Created**: ${item.created_at}\n`;
    output += `- **Hash**: ${item.content_hash.substring(0, 16)}...\n\n`;
    output += `**Preview**:\n${preview}\n\n`;
    output += '---\n\n';
  });
  
  return output;
}

export const knowledgeQueryTool = {
  name: 'knowledge_query',
  description: 'Search and retrieve knowledge from the persistent knowledge base. Filter by category, priority, or keyword.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        description: 'Filter by knowledge category (optional)'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Filter by priority level (optional)'
      },
      keyword: {
        type: 'string',
        description: 'Search keyword in title or content (optional)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (1-100, default: 20)'
      }
    }
  }
};
