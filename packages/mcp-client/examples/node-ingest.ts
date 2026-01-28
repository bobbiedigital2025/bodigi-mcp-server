/**
 * Example: Using knowledge_ingest tool with MCP Client
 * 
 * This example demonstrates how to ingest knowledge from various sources
 * into the BoDiGi MCP Server for AI learning and bot updates.
 */

import { MCPClient } from '../dist/index.js';

async function main() {
  // Initialize the client with OAuth authentication
  const client = new MCPClient({
    baseUrl: process.env.BODIGI_MCP_URL || 'https://mcp.bodigi.com',
    // You can use either apiKey or oauthToken
    oauthToken: process.env.BODIGI_OAUTH_TOKEN || process.env.BODIGI_API_KEY,
    timeout: 30000,
    maxRetries: 3,
    enableAuditLog: true
  });

  console.log('🚀 MCP Client - Knowledge Ingest Example\n');

  try {
    // Example 1: Ingest manual knowledge
    console.log('📚 Ingesting manual knowledge...');
    const manualResult = await client.callTool('knowledge_ingest', {
      source: 'manual',
      content: 'New research shows that transformer models with attention mechanisms are highly effective for NLP tasks.',
      category: 'ai-research',
      priority: 'high'
    });

    console.log('✅ Manual knowledge ingested!');
    console.log(manualResult.content[0].text);
    console.log('');

    // Example 2: Ingest from RSS feed
    console.log('📰 Ingesting from RSS feed...');
    const rssResult = await client.callTool('knowledge_ingest', {
      source: 'rss',
      content: 'Latest AI developments from tech blogs and research papers.',
      category: 'tech-news',
      priority: 'medium'
    });

    console.log('✅ RSS content ingested!');
    console.log(rssResult.content[0].text);
    console.log('');

    // Example 3: Ingest API data
    console.log('🔌 Ingesting from API...');
    const apiResult = await client.callTool('knowledge_ingest', {
      source: 'api',
      content: JSON.stringify({
        title: 'Best Practices for React 19',
        summary: 'React 19 introduces new features like Server Components and improved concurrent rendering.',
        url: 'https://react.dev/blog'
      }),
      category: 'web-development',
      priority: 'medium'
    });

    console.log('✅ API data ingested!');
    console.log(apiResult.content[0].text);
    console.log('');

    // Example 4: Using runJob for batch ingestion
    console.log('🔄 Running batch ingestion job...');
    const batchData = [
      {
        source: 'manual',
        content: 'Python 3.12 introduces improved error messages and performance optimizations.',
        category: 'python',
        priority: 'medium'
      },
      {
        source: 'manual',
        content: 'TypeScript 5.3 adds decorators and improved type inference.',
        category: 'typescript',
        priority: 'medium'
      },
      {
        source: 'manual',
        content: 'Rust continues to gain popularity for systems programming.',
        category: 'rust',
        priority: 'low'
      }
    ];

    const jobResult = await client.runJob('knowledge_ingest', {
      batch: batchData,
      operation: 'bulk_ingest'
    });

    if (jobResult.status === 'success') {
      console.log('✅ Batch ingestion job completed!');
      console.log('Result:', JSON.stringify(jobResult.data, null, 2));
    } else {
      console.log('❌ Batch job failed:', jobResult.error);
    }
    console.log('');

    // Example of blocked operation (will fail validation)
    console.log('🚫 Attempting unsafe operation...');
    try {
      await client.callTool('knowledge_ingest', {
        source: 'api',
        content: 'eval("malicious code")',
        category: 'test'
      });
    } catch (error) {
      console.log('Expected error:', error instanceof Error ? error.message : String(error));
    }
    console.log('');

    // Display audit logs
    console.log('📝 Audit Logs Summary:');
    const logs = client.getAuditLogs();
    const successful = logs.filter(l => l.success).length;
    const failed = logs.filter(l => !l.success).length;
    console.log(`Total operations: ${logs.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log('');

    // Export audit logs to file
    console.log('💾 Exporting audit logs...');
    const auditJson = client.exportAuditLogs();
    console.log('Audit logs exported (sample):');
    console.log(auditJson.substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
main();
