import { z } from 'zod';
import { safeFetch, isFetchError } from '../utils/ssrf-safe-fetch.js';

/**
 * Web Fetch Tool
 * Controlled web fetching with SSRF protection and rate limiting
 */

export const webFetchSchema = z.object({
  url: z.string().url().describe('The URL to fetch'),
  extractType: z
    .enum(['text', 'metadata', 'links'])
    .optional()
    .describe('Type of content to extract'),
  maxLength: z.number().optional().describe('Maximum content length in characters'),
});

export type WebFetchInput = z.infer<typeof webFetchSchema>;

export async function executeWebFetch(input: WebFetchInput): Promise<string> {
  const { url, extractType = 'text', maxLength = 5000 } = input;

  // Perform SSRF-safe fetch
  const result = await safeFetch(url);

  // Check if fetch failed
  if (isFetchError(result)) {
    return `⚠️ Fetch Failed\n\n**URL**: ${result.url}\n**Reason**: ${result.reason}\n${result.details ? `**Details**: ${result.details}` : ''}\n\nPlease verify the URL is correct and from an allowed domain.`;
  }

  // Format result based on extractType
  let output = '';

  switch (extractType) {
    case 'metadata':
      output = `# Metadata from ${url}\n\n- **Title**: ${result.title}\n- **Content Hash**: ${result.contentHash}\n- **Fetched At**: ${result.fetchedAt}\n- **Status Code**: ${result.statusCode}\n- **Content Length**: ${result.content.length} characters`;
      break;

    case 'links': {
      // Extract links from content (basic implementation)
      const linkMatches = result.content.match(/https?:\/\/[^\s]+/g) || [];
      const uniqueLinks = [...new Set(linkMatches)].slice(0, 20);
      output = `# Links found in ${url}\n\n${uniqueLinks.map((link) => `- ${link}`).join('\n')}\n\nTotal unique links: ${uniqueLinks.length}`;
      break;
    }

    case 'text':
    default:
      output = `# ${result.title}\n\n**Source**: ${url}\n**Fetched**: ${result.fetchedAt}\n\n${result.content}`;
      break;
  }

  // Apply length constraint
  if (output.length > maxLength) {
    output = output.substring(0, maxLength) + '\n\n... (truncated to max length)';
  }

  return output;
}

export const webFetchTool = {
  name: 'web_fetch',
  description:
    'Controlled web content fetching with safety checks and rate limiting. Only fetches from approved domains.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch (must be from approved domains)',
      },
      extractType: {
        type: 'string',
        enum: ['text', 'metadata', 'links'],
        description: 'Type of content to extract (optional)',
      },
      maxLength: {
        type: 'number',
        description: 'Maximum content length in characters (optional)',
      },
    },
    required: ['url'],
  },
};
