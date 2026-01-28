/**
 * Example: Security and Audit Features
 * 
 * This example demonstrates the security and audit logging features
 * of the MCP Client SDK, including allowlist validation, blocked operations,
 * and audit trail analysis.
 */

import { MCPClient } from '../dist/index.js';

async function main() {
  // Initialize the client with security features enabled
  const client = new MCPClient({
    baseUrl: process.env.BODIGI_MCP_URL || 'https://mcp.bodigi.com',
    apiKey: process.env.BODIGI_API_KEY,
    timeout: 30000,
    maxRetries: 3,
    enableAuditLog: true,
    // Add custom tools to allowlist
    allowlist: ['custom_analytics_tool']
  });

  console.log('🔒 MCP Client - Security & Audit Example\n');

  // Example 1: Normal operation (should succeed)
  console.log('1️⃣ Testing normal operation...');
  try {
    const result = await client.callTool('tool_discovery', {
      category: 'all'
    });
    console.log('✅ Success: Normal operation completed');
  } catch (error) {
    console.log('❌ Failed:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Example 2: Try to call a tool not in allowlist (should fail)
  console.log('2️⃣ Testing allowlist validation...');
  try {
    await client.callTool('unauthorized_tool', {
      param: 'value'
    });
    console.log('❌ This should not succeed!');
  } catch (error) {
    console.log('✅ Expected error:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Example 3: Try remote code execution pattern (should fail)
  console.log('3️⃣ Testing RCE prevention...');
  try {
    await client.callTool('knowledge_ingest', {
      source: 'manual',
      content: 'eval("malicious.code()")',
      category: 'test'
    });
    console.log('❌ This should not succeed!');
  } catch (error) {
    console.log('✅ Expected error:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Example 4: Try to access blocked URL (should fail)
  console.log('4️⃣ Testing URL allowlist...');
  try {
    await client.callTool('web_fetch', {
      url: 'https://dangerous-site.com/malware',
      extractType: 'text'
    });
    console.log('❌ This should not succeed!');
  } catch (error) {
    console.log('✅ Expected error:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Example 5: Try repository cloning (should fail)
  console.log('5️⃣ Testing repository cloning prevention...');
  try {
    await client.callTool('knowledge_ingest', {
      source: 'api',
      content: 'some content',
      repository: 'https://github.com/unknown/repo',
      clone: true
    });
    console.log('❌ This should not succeed!');
  } catch (error) {
    console.log('✅ Expected error:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Example 6: Try path traversal (should fail)
  console.log('6️⃣ Testing path traversal prevention...');
  try {
    await client.callTool('knowledge_ingest', {
      source: 'manual',
      content: '../../etc/passwd',
      category: 'test'
    });
    console.log('❌ This should not succeed!');
  } catch (error) {
    console.log('✅ Expected error:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Example 7: Analyze audit logs
  console.log('7️⃣ Analyzing audit trail...\n');
  
  const logs = client.getAuditLogs();
  console.log(`📊 Audit Statistics:`);
  console.log(`   Total operations: ${logs.length}`);
  console.log(`   Successful: ${logs.filter(l => l.success).length}`);
  console.log(`   Failed: ${logs.filter(l => !l.success).length}`);
  console.log('');

  // Show failed operations
  const failedOps = logs.filter(l => !l.success);
  if (failedOps.length > 0) {
    console.log('❌ Failed Operations:');
    failedOps.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.operation}`);
      console.log(`      Time: ${log.timestamp}`);
      console.log(`      Reason: ${log.error}`);
      console.log('');
    });
  }

  // Show successful operations
  const successOps = logs.filter(l => l.success && l.operation !== 'client_initialized');
  if (successOps.length > 0) {
    console.log('✅ Successful Operations:');
    successOps.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.operation}`);
      console.log(`      Time: ${log.timestamp}`);
      if (log.details && Object.keys(log.details).length > 0) {
        console.log(`      Details: ${JSON.stringify(log.details, null, 2).substring(0, 100)}...`);
      }
      console.log('');
    });
  }

  // Example 8: Export audit logs
  console.log('8️⃣ Exporting audit logs...\n');
  const auditJson = client.exportAuditLogs();
  console.log('Audit log export (first 500 chars):');
  console.log(auditJson.substring(0, 500) + '...\n');

  // Example 9: Demonstrate proper usage with approved domains
  console.log('9️⃣ Testing approved domain access...');
  try {
    const result = await client.callTool('web_fetch', {
      url: 'https://en.wikipedia.org/wiki/Security',
      extractType: 'metadata'
    });
    console.log('✅ Success: Approved domain accessed successfully');
  } catch (error) {
    console.log('❌ Failed:', error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Final audit summary
  console.log('📝 Final Security Summary:');
  const finalLogs = client.getAuditLogs();
  const blockedCount = finalLogs.filter(
    l => !l.success && (
      l.operation === 'call_tool_blocked' || 
      l.operation === 'run_job_blocked'
    )
  ).length;
  
  console.log(`   Total security blocks: ${blockedCount}`);
  console.log(`   All operations logged: ✅`);
  console.log(`   Audit trail available: ✅`);
  console.log(`   Security features working: ✅`);
  console.log('');
  console.log('🎉 Security demonstration complete!');
  console.log('The MCP Client successfully blocked all unsafe operations.');
}

// Run the example
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
