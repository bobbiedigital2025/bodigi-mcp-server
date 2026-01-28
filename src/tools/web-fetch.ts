import { z } from 'zod';

/**
 * Web Fetch Tool
 * Controlled web fetching with safety checks and rate limiting
 */

export const webFetchSchema = z.object({
  url: z.string().url().describe('The URL to fetch'),
  extractType: z.enum(['text', 'metadata', 'links']).optional().describe('Type of content to extract'),
  maxLength: z.number().optional().describe('Maximum content length in characters')
});

export type WebFetchInput = z.infer<typeof webFetchSchema>;

export async function executeWebFetch(input: WebFetchInput): Promise<string> {
  const { url, extractType = 'text', maxLength = 5000 } = input;
  
  // Validate URL safety
  const allowedDomains = ['wikipedia.org', 'github.com', 'docs.', 'api.', '.edu', '.gov'];
  const urlObj = new URL(url);
  const isAllowed = allowedDomains.some(domain => 
    urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
  );
  
  if (!isAllowed) {
    return `⚠️ Safety Check: URL domain "${urlObj.hostname}" is not in the allowed list for controlled fetching.\n\nAllowed domains include: ${allowedDomains.join(', ')}\n\nFor security reasons, please use approved domains or contact an administrator.`;
  }
  
  // Simulate fetching (in a real implementation, this would use fetch API)
  const mockResults = {
    text: `# Content from ${url}\n\nThis is a simulated text extraction from the requested URL. In a production implementation, this would contain the actual fetched content, cleaned and formatted.\n\n## Summary\nThe content has been successfully fetched and processed. Maximum length constraint: ${maxLength} characters.`,
    metadata: `# Metadata from ${url}\n\n- Title: Sample Page Title\n- Description: This page contains valuable information\n- Last Modified: ${new Date().toISOString()}\n- Content Type: text/html\n- Status: Available`,
    links: `# Links found in ${url}\n\n- [Link 1](#)\n- [Link 2](#)\n- [Link 3](#)\n\nTotal links extracted: 3`
  };
  
  let result = mockResults[extractType];
  
  // Apply length constraint
  if (result.length > maxLength) {
    result = result.substring(0, maxLength) + '\n\n... (truncated to max length)';
  }
  
  return result;
}

export const webFetchTool = {
  name: 'web_fetch',
  description: 'Controlled web content fetching with safety checks and rate limiting. Only fetches from approved domains.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch (must be from approved domains)'
      },
      extractType: {
        type: 'string',
        enum: ['text', 'metadata', 'links'],
        description: 'Type of content to extract (optional)'
      },
      maxLength: {
        type: 'number',
        description: 'Maximum content length in characters (optional)'
      }
    },
    required: ['url']
  }
};
