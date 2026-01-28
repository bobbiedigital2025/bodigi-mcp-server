/**
 * Example: Calling the web_fetch tool using MCP Client
 * 
 * This example demonstrates how to use the MCP Client to call
 * the web_fetch tool and retrieve content from approved URLs.
 */

import { MCPClient } from '../dist/index.js';

async function main() {
  // Initialize the client with API key authentication
  const client = new MCPClient({
    baseUrl: process.env.BODIGI_MCP_URL || 'https://mcp.bodigi.com',
    apiKey: process.env.BODIGI_API_KEY,
    timeout: 30000,
    maxRetries: 3,
    enableAuditLog: true
  });

  console.log('🚀 MCP Client - Web Fetch Example\n');

  try {
    // List all available tools
    console.log('📋 Listing available tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.length} tools:`, tools.map(t => t.name).join(', '));
    console.log('');

    // Call the web_fetch tool
    console.log('🌐 Fetching web content...');
    const result = await client.callTool('web_fetch', {
      url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
      extractType: 'text',
      maxLength: 1000
    });

    console.log('✅ Fetch successful!');
    console.log('\nResult:');
    console.log(result.content[0].text);
    console.log('');

    // Try fetching metadata
    console.log('📊 Fetching metadata...');
    const metadataResult = await client.callTool('web_fetch', {
      url: 'https://github.com/modelcontextprotocol',
      extractType: 'metadata'
    });

    console.log('✅ Metadata fetch successful!');
    console.log('\nMetadata:');
    console.log(metadataResult.content[0].text);
    console.log('');

    // Example of blocked URL (will fail validation)
    console.log('🚫 Attempting to fetch from blocked domain...');
    try {
      await client.callTool('web_fetch', {
        url: 'https://example.com/malicious-site',
        extractType: 'text'
      });
    } catch (error) {
      console.log('Expected error:', error instanceof Error ? error.message : String(error));
    }
    console.log('');

    // Display audit logs
    console.log('📝 Audit Logs:');
    const logs = client.getAuditLogs();
    console.log(`Total operations logged: ${logs.length}`);
    logs.slice(-5).forEach(log => {
      const status = log.success ? '✅' : '❌';
      console.log(`${status} [${log.timestamp}] ${log.operation}`);
    });

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
main();
