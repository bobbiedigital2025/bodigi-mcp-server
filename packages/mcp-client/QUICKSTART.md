# Quick Start Guide - MCP Client SDK

Get started with the BoDiGi MCP Client SDK in 5 minutes!

## 1. Install the Package

```bash
npm install @bodigi/mcp-client
```

## 2. Set Up Environment Variables

Create a `.env` file in your project:

```bash
BODIGI_MCP_URL=https://mcp.bodigi.com
BODIGI_API_KEY=your_api_key_here
```

## 3. Create Your First Client

```typescript
import { MCPClient } from '@bodigi/mcp-client';

const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY
});
```

## 4. Call Your First Tool

```typescript
async function main() {
  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools.map(t => t.name));

  // Call the AI teaching tool
  const result = await client.callTool('ai_teaching', {
    topic: 'JavaScript Promises',
    level: 'intermediate',
    format: 'example'
  });

  console.log('Teaching content:', result.content[0].text);
}

main().catch(console.error);
```

## 5. Run Your Code

```bash
node your-file.js
```

## That's It! 🎉

You now have a working MCP client. Here's what you get automatically:

✅ Secure authentication
✅ Automatic retries
✅ Timeout handling
✅ Security validation
✅ Complete audit trail

## Next Steps

### Try Other Tools

```typescript
// Fetch web content
await client.callTool('web_fetch', {
  url: 'https://en.wikipedia.org/wiki/AI',
  extractType: 'text'
});

// Ingest knowledge
await client.callTool('knowledge_ingest', {
  source: 'manual',
  content: 'Important information...',
  category: 'research'
});

// Generate lessons
await client.callTool('lesson_quiz_gen', {
  topic: 'Python Basics',
  type: 'both',
  difficulty: 'easy'
});
```

### Run Batch Operations

```typescript
const jobResult = await client.runJob('knowledge_ingest', {
  batch: [
    { source: 'manual', content: 'Item 1', category: 'test' },
    { source: 'manual', content: 'Item 2', category: 'test' }
  ],
  operation: 'bulk_ingest'
});
```

### Check Audit Logs

```typescript
const logs = client.getAuditLogs();
console.log(`Total operations: ${logs.length}`);

const failed = logs.filter(l => !l.success);
console.log(`Failed operations: ${failed.length}`);
```

## Common Configurations

### With Custom Timeout

```typescript
const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY,
  timeout: 60000  // 60 seconds
});
```

### With More Retries

```typescript
const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY,
  maxRetries: 5
});
```

### With OAuth

```typescript
const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  oauthToken: process.env.BODIGI_OAUTH_TOKEN
});
```

### With Custom Allowlist

```typescript
const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY,
  allowlist: ['my_custom_tool']  // Add to default allowlist
});
```

## Error Handling

```typescript
try {
  const result = await client.callTool('ai_teaching', {
    topic: 'React',
    level: 'advanced'
  });
  console.log('Success!', result);
} catch (error) {
  console.error('Error:', error.message);
  
  // Check audit logs for details
  const logs = client.getAuditLogs();
  const lastLog = logs[logs.length - 1];
  console.log('Last operation:', lastLog);
}
```

## Need More Help?

- 📖 **Full Documentation**: [README.md](./README.md)
- 🔧 **Integration Guides**: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
- 💡 **Examples**: Check the `/examples` directory
- 🔒 **Security**: All operations are validated and logged

## Security Note

The client automatically blocks:
- ❌ Remote code execution
- ❌ Unauthorized repository cloning
- ❌ Unsafe URL domains
- ❌ Path traversal attempts

All operations are logged for security auditing. 🛡️

Happy coding! 🚀
