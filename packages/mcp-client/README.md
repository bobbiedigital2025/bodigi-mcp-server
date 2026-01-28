# @bodigi/mcp-client

Lightweight Node/TS client SDK for connecting to BoDiGi MCP Server from any application.

## 🌟 Features

- **🔐 Dual Authentication**: Supports both API Key and OAuth token authentication
- **🔄 Smart Retries**: Automatic retry with exponential backoff
- **⏱️ Timeout Handling**: Configurable request timeouts
- **🛡️ Security Built-in**: 
  - Allowlist validation for tools and operations
  - Prevents remote code execution
  - Blocks unsafe patterns and repository cloning
  - Domain allowlist for web operations
- **📝 Audit Logging**: Complete audit trail of all operations
- **📦 Type-Safe**: Full TypeScript support with type definitions
- **🚀 Easy to Use**: Simple, intuitive API

## 📦 Installation

```bash
npm install @bodigi/mcp-client
```

Or with yarn:

```bash
yarn add @bodigi/mcp-client
```

## 🚀 Quick Start

### Basic Usage with API Key

```typescript
import { MCPClient } from '@bodigi/mcp-client';

const client = new MCPClient({
  baseUrl: 'https://mcp.bodigi.com',
  apiKey: process.env.BODIGI_API_KEY
});

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool('ai_teaching', {
  topic: 'JavaScript Promises',
  level: 'intermediate',
  format: 'example'
});

console.log('Teaching result:', result.content[0].text);
```

### Using OAuth Authentication

```typescript
const client = new MCPClient({
  baseUrl: 'https://mcp.bodigi.com',
  oauthToken: process.env.BODIGI_OAUTH_TOKEN
});
```

### Running Jobs (Batch Operations)

```typescript
const jobResult = await client.runJob('knowledge_ingest', {
  batch: [
    { source: 'manual', content: 'Item 1', category: 'test' },
    { source: 'manual', content: 'Item 2', category: 'test' }
  ],
  operation: 'bulk_ingest'
});

if (jobResult.status === 'success') {
  console.log('Job completed:', jobResult.data);
} else {
  console.error('Job failed:', jobResult.error);
}
```

## 🔧 Configuration

### Client Configuration Options

```typescript
interface MCPClientConfig {
  baseUrl: string;           // Required: Base URL of the MCP server
  apiKey?: string;           // API key for authentication
  oauthToken?: string;       // OAuth token for authentication
  timeout?: number;          // Request timeout in ms (default: 30000)
  maxRetries?: number;       // Max retry attempts (default: 3)
  retryDelay?: number;       // Initial retry delay in ms (default: 1000)
  enableAuditLog?: boolean;  // Enable audit logging (default: true)
  allowlist?: string[];      // Custom tool allowlist
}
```

### Example with All Options

```typescript
const client = new MCPClient({
  baseUrl: 'https://mcp.bodigi.com',
  apiKey: process.env.BODIGI_API_KEY,
  timeout: 60000,           // 60 second timeout
  maxRetries: 5,            // Try up to 5 times
  retryDelay: 2000,         // Start with 2 second delay
  enableAuditLog: true,     // Keep audit trail
  allowlist: [              // Custom tools (in addition to defaults)
    'custom_tool_1',
    'custom_tool_2'
  ]
});
```

## 🌐 Environment Variables

The MCP Client can be configured using environment variables:

```bash
# Required: Server URL
BODIGI_MCP_URL=https://mcp.bodigi.com

# Authentication (choose one)
BODIGI_API_KEY=your_api_key_here
BODIGI_OAUTH_TOKEN=your_oauth_token_here

# Optional: Timeout and retry settings
BODIGI_TIMEOUT=30000
BODIGI_MAX_RETRIES=3
BODIGI_RETRY_DELAY=1000

# Optional: Disable audit logging
BODIGI_AUDIT_LOG=false
```

### Using in Your App

```typescript
const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY,
  timeout: parseInt(process.env.BODIGI_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.BODIGI_MAX_RETRIES || '3')
});
```

## 📚 API Reference

### `listTools()`

List all available tools from the MCP server.

```typescript
const tools = await client.listTools();
// Returns: Tool[]

interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}
```

### `callTool(toolName, params)`

Call a specific tool with parameters.

```typescript
const result = await client.callTool('web_fetch', {
  url: 'https://en.wikipedia.org/wiki/AI',
  extractType: 'text',
  maxLength: 1000
});
// Returns: ToolCallResult

interface ToolCallResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}
```

### `runJob(jobName, payload)`

Execute a batch operation or workflow.

```typescript
const result = await client.runJob('batch_ingest', {
  items: [...],
  options: {...}
});
// Returns: JobResult

interface JobResult {
  status: 'success' | 'error';
  data?: any;
  error?: string;
}
```

### `getAuditLogs()`

Retrieve all audit logs.

```typescript
const logs = client.getAuditLogs();
// Returns: AuditLogEntry[]
```

### `exportAuditLogs()`

Export audit logs as JSON string.

```typescript
const json = client.exportAuditLogs();
console.log(json);
```

## 🔒 Security Features

### Allowlist Validation

By default, only approved tools can be called:
- `ai_teaching`
- `tool_discovery`
- `web_fetch`
- `knowledge_ingest`
- `lesson_quiz_gen`
- `bot_knowledge_update`

You can add custom tools to the allowlist:

```typescript
const client = new MCPClient({
  baseUrl: 'https://mcp.bodigi.com',
  apiKey: process.env.BODIGI_API_KEY,
  allowlist: ['my_custom_tool']
});
```

### Blocked Operations

The client automatically blocks:
- Remote code execution (`eval`, `exec`, `spawn`)
- Repository cloning and running unknown code
- Path traversal attempts
- Unsafe URL protocols (`file://`, `javascript:`)
- Script injection attempts
- Unapproved domain access

### Domain Allowlist for Web Operations

Web fetch operations are restricted to approved domains:
- `wikipedia.org`
- `github.com`
- `docs.*`
- `api.*`
- `*.edu`
- `*.gov`

### Audit Logging

All operations are logged with:
- Timestamp
- Operation type
- Parameters
- Success/failure status
- Error messages (if any)

Example audit log entry:
```json
{
  "timestamp": "2026-01-28T13:54:40.960Z",
  "operation": "call_tool",
  "details": {
    "toolName": "web_fetch",
    "params": {
      "url": "https://en.wikipedia.org/wiki/AI"
    }
  },
  "success": true
}
```

## 📖 Available Tools

### 1. AI Teaching (`ai_teaching`)
Provides adaptive AI teaching for various topics.

```typescript
await client.callTool('ai_teaching', {
  topic: 'Python Decorators',
  level: 'advanced',        // beginner | intermediate | advanced
  format: 'example'         // explanation | example | practice
});
```

### 2. Tool Discovery (`tool_discovery`)
Discover available MCP tools and their capabilities.

```typescript
await client.callTool('tool_discovery', {
  category: 'learning',     // learning | automation | content | all
  search: 'quiz'            // Optional search term
});
```

### 3. Web Fetch (`web_fetch`)
Controlled web content fetching with safety checks.

```typescript
await client.callTool('web_fetch', {
  url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
  extractType: 'text',      // text | metadata | links
  maxLength: 3000           // Optional max length
});
```

### 4. Knowledge Ingest (`knowledge_ingest`)
Ingest and process knowledge from multiple sources.

```typescript
await client.callTool('knowledge_ingest', {
  source: 'manual',         // rss | api | document | manual
  content: 'Knowledge to ingest...',
  category: 'ai-research',  // Optional category
  priority: 'high'          // low | medium | high
});
```

### 5. Lesson & Quiz Generation (`lesson_quiz_gen`)
Generate lessons and quizzes automatically.

```typescript
await client.callTool('lesson_quiz_gen', {
  topic: 'JavaScript Async/Await',
  type: 'both',             // lesson | quiz | both
  difficulty: 'medium',     // easy | medium | hard
  questionCount: 10         // 1-20 questions (for quizzes)
});
```

### 6. Bot Knowledge Update (`bot_knowledge_update`)
Update bot knowledge bases with new information.

```typescript
await client.callTool('bot_knowledge_update', {
  botId: 'assistant-001',
  knowledge: 'New information about React 19...',
  operation: 'add',         // add | update | remove
  tags: ['react', 'frontend']
});
```

## 📝 Examples

Check out the `/examples` directory for complete examples:

### `examples/node-call-fetch.ts`
Demonstrates calling the `web_fetch` tool to retrieve web content.

```bash
# Build the package and examples
npm install
npm run build
npm run build:examples

# Run the example
npm run example:fetch
```

### `examples/node-ingest.ts`
Shows how to ingest knowledge from various sources.

```bash
npm run example:ingest
```

### `examples/security-demo.ts`
Demonstrates security features and audit logging.

```bash
npm run example:security
```

## 🧪 Error Handling

```typescript
try {
  const result = await client.callTool('web_fetch', {
    url: 'https://example.com'
  });
  console.log(result);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    
    // Check audit logs for details
    const logs = client.getAuditLogs();
    const failedOps = logs.filter(l => !l.success);
    console.log('Failed operations:', failedOps);
  }
}
```

## 🛠️ Development

### Building the Package

```bash
cd packages/mcp-client
npm install
npm run build
```

### Running Examples

```bash
# Set environment variables
export BODIGI_MCP_URL=https://mcp.bodigi.com
export BODIGI_API_KEY=your_api_key

# Run examples
node examples/node-call-fetch.ts
node examples/node-ingest.ts
```

## 🤝 Contributing

Contributions are welcome! Please ensure that:
1. Security features remain intact
2. Audit logging is maintained
3. Tests pass (if applicable)
4. Type definitions are updated

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related

- [BoDiGi MCP Server](https://github.com/bobbiedigital2025/bodigi-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 💬 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review audit logs for debugging

## ⚠️ Safety Note

This client is designed with safety in mind:
- ✅ Allowlists for operations
- ✅ No remote code execution
- ✅ No unauthorized repository cloning
- ✅ Complete audit trail
- ✅ Domain restrictions for web operations

Always review audit logs and use appropriate authentication in production environments.
