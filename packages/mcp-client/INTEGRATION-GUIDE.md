# How to Use MCP Client SDK from Any App

This guide shows how to integrate the BoDiGi MCP Client SDK into various types of applications.

## 📋 Table of Contents

1. [General Setup](#general-setup)
2. [Node.js / Express Applications](#nodejs--express-applications)
3. [Next.js Applications](#nextjs-applications)
4. [NestJS Applications](#nestjs-applications)
5. [Command-Line Tools](#command-line-tools)
6. [AWS Lambda Functions](#aws-lambda-functions)
7. [Docker Containers](#docker-containers)
8. [Environment Variables](#environment-variables)
9. [Best Practices](#best-practices)

---

## General Setup

### 1. Install the Client

```bash
npm install @bodigi/mcp-client
```

### 2. Set Environment Variables

Create a `.env` file in your project root:

```bash
BODIGI_MCP_URL=https://mcp.bodigi.com
BODIGI_API_KEY=your_api_key_here
```

### 3. Initialize the Client

```typescript
import { MCPClient } from '@bodigi/mcp-client';

const client = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});
```

---

## Node.js / Express Applications

### Basic Integration

```typescript
// app.ts
import express from 'express';
import { MCPClient } from '@bodigi/mcp-client';

const app = express();
const mcpClient = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY
});

// Middleware to add MCP client to request
app.use((req, res, next) => {
  (req as any).mcpClient = mcpClient;
  next();
});

// Example route using MCP client
app.post('/api/teach', async (req, res) => {
  try {
    const { topic, level } = req.body;
    
    const result = await mcpClient.callTool('ai_teaching', {
      topic,
      level,
      format: 'example'
    });
    
    res.json({ success: true, data: result.content[0].text });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Service Pattern

```typescript
// services/mcp.service.ts
import { MCPClient, Tool } from '@bodigi/mcp-client';

class MCPService {
  private client: MCPClient;

  constructor() {
    this.client = new MCPClient({
      baseUrl: process.env.BODIGI_MCP_URL!,
      apiKey: process.env.BODIGI_API_KEY,
      timeout: 30000
    });
  }

  async getAvailableTools(): Promise<Tool[]> {
    return await this.client.listTools();
  }

  async teachTopic(topic: string, level: string) {
    return await this.client.callTool('ai_teaching', {
      topic,
      level,
      format: 'example'
    });
  }

  async ingestKnowledge(content: string, category: string) {
    return await this.client.callTool('knowledge_ingest', {
      source: 'manual',
      content,
      category,
      priority: 'medium'
    });
  }

  getAuditTrail() {
    return this.client.getAuditLogs();
  }
}

export default new MCPService();
```

---

## Next.js Applications

### API Routes

```typescript
// pages/api/mcp/teach.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MCPClient } from '@bodigi/mcp-client';

// Create client instance (consider using a singleton)
const mcpClient = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, level } = req.body;

    const result = await mcpClient.callTool('ai_teaching', {
      topic,
      level,
      format: 'example'
    });

    res.status(200).json({
      success: true,
      data: result.content[0].text
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### App Router (Next.js 13+)

```typescript
// app/api/mcp/teach/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MCPClient } from '@bodigi/mcp-client';

const mcpClient = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { topic, level } = await request.json();

    const result = await mcpClient.callTool('ai_teaching', {
      topic,
      level,
      format: 'example'
    });

    return NextResponse.json({
      success: true,
      data: result.content[0].text
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Client-Side Hook

```typescript
// hooks/useMCP.ts
import { useState, useCallback } from 'react';

export function useMCP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teachTopic = useCallback(async (topic: string, level: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mcp/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { teachTopic, loading, error };
}
```

---

## NestJS Applications

### Module Setup

```typescript
// mcp/mcp.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MCPService } from './mcp.service';
import { MCPController } from './mcp.controller';

@Module({
  imports: [ConfigModule],
  providers: [MCPService],
  controllers: [MCPController],
  exports: [MCPService]
})
export class MCPModule {}
```

### Service

```typescript
// mcp/mcp.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MCPClient, Tool } from '@bodigi/mcp-client';

@Injectable()
export class MCPService {
  private client: MCPClient;

  constructor(private configService: ConfigService) {
    this.client = new MCPClient({
      baseUrl: this.configService.get('BODIGI_MCP_URL')!,
      apiKey: this.configService.get('BODIGI_API_KEY'),
      timeout: 30000,
      maxRetries: 3
    });
  }

  async listTools(): Promise<Tool[]> {
    return await this.client.listTools();
  }

  async callTool(toolName: string, params: Record<string, any>) {
    return await this.client.callTool(toolName, params);
  }

  async teachTopic(topic: string, level: string) {
    return await this.client.callTool('ai_teaching', {
      topic,
      level,
      format: 'example'
    });
  }

  getAuditLogs() {
    return this.client.getAuditLogs();
  }
}
```

### Controller

```typescript
// mcp/mcp.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { MCPService } from './mcp.service';

@Controller('mcp')
export class MCPController {
  constructor(private readonly mcpService: MCPService) {}

  @Get('tools')
  async getTools() {
    return await this.mcpService.listTools();
  }

  @Post('teach')
  async teach(@Body() body: { topic: string; level: string }) {
    return await this.mcpService.teachTopic(body.topic, body.level);
  }

  @Get('audit')
  getAudit() {
    return this.mcpService.getAuditLogs();
  }
}
```

---

## Command-Line Tools

### Simple CLI

```typescript
#!/usr/bin/env node
// cli.ts
import { MCPClient } from '@bodigi/mcp-client';

async function main() {
  const client = new MCPClient({
    baseUrl: process.env.BODIGI_MCP_URL!,
    apiKey: process.env.BODIGI_API_KEY
  });

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      const tools = await client.listTools();
      console.log('Available tools:');
      tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
      break;

    case 'teach':
      const topic = args[1];
      const level = args[2] || 'intermediate';
      
      if (!topic) {
        console.error('Usage: cli teach <topic> [level]');
        process.exit(1);
      }

      const result = await client.callTool('ai_teaching', {
        topic,
        level,
        format: 'example'
      });
      console.log(result.content[0].text);
      break;

    default:
      console.log('Usage: cli <command> [args]');
      console.log('Commands:');
      console.log('  list              - List available tools');
      console.log('  teach <topic>     - Get teaching content');
  }
}

main().catch(console.error);
```

---

## AWS Lambda Functions

### Lambda Handler

```typescript
// handler.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { MCPClient } from '@bodigi/mcp-client';

// Initialize client outside handler for reuse
const mcpClient = new MCPClient({
  baseUrl: process.env.BODIGI_MCP_URL!,
  apiKey: process.env.BODIGI_API_KEY,
  timeout: 25000  // Leave buffer for Lambda timeout
});

export const teach: APIGatewayProxyHandler = async (event) => {
  try {
    const { topic, level } = JSON.parse(event.body || '{}');

    if (!topic || !level) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing topic or level' })
      };
    }

    const result = await mcpClient.callTool('ai_teaching', {
      topic,
      level,
      format: 'example'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.content[0].text
      })
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
```

### Serverless Configuration

```yaml
# serverless.yml
service: bodigi-mcp-integration

provider:
  name: aws
  runtime: nodejs18.x
  environment:
    BODIGI_MCP_URL: ${env:BODIGI_MCP_URL}
    BODIGI_API_KEY: ${env:BODIGI_API_KEY}

functions:
  teach:
    handler: handler.teach
    events:
      - http:
          path: teach
          method: post
          cors: true
```

---

## Docker Containers

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables (will be overridden at runtime)
ENV BODIGI_MCP_URL=https://mcp.bodigi.com
ENV BODIGI_API_KEY=

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BODIGI_MCP_URL=${BODIGI_MCP_URL}
      - BODIGI_API_KEY=${BODIGI_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BODIGI_MCP_URL` | MCP Server base URL | `https://mcp.bodigi.com` |
| `BODIGI_API_KEY` or `BODIGI_OAUTH_TOKEN` | Authentication credentials | `your_key_here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BODIGI_TIMEOUT` | Request timeout (ms) | `30000` |
| `BODIGI_MAX_RETRIES` | Maximum retry attempts | `3` |
| `BODIGI_RETRY_DELAY` | Initial retry delay (ms) | `1000` |
| `BODIGI_AUDIT_LOG` | Enable audit logging | `true` |

### Environment Variable Validation

```typescript
// config/validate-env.ts
function validateEnv() {
  const required = ['BODIGI_MCP_URL', 'BODIGI_API_KEY'];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

validateEnv();
```

---

## Best Practices

### 1. Use Singleton Pattern

```typescript
// lib/mcp-client.ts
import { MCPClient } from '@bodigi/mcp-client';

let client: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!client) {
    client = new MCPClient({
      baseUrl: process.env.BODIGI_MCP_URL!,
      apiKey: process.env.BODIGI_API_KEY,
      timeout: 30000,
      maxRetries: 3
    });
  }
  return client;
}
```

### 2. Error Handling

```typescript
async function safeCallTool(toolName: string, params: any) {
  try {
    const result = await client.callTool(toolName, params);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Tool call failed: ${toolName}`, error);
    
    // Check if it's a security validation error
    if (error instanceof Error && error.message.includes('allowlist')) {
      return { success: false, error: 'Tool not authorized' };
    }
    
    // Check if it's a timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return { success: false, error: 'Request timed out' };
    }
    
    return { success: false, error: 'Unknown error' };
  }
}
```

### 3. Monitoring with Audit Logs

```typescript
// Periodic audit log export
setInterval(() => {
  const logs = client.getAuditLogs();
  const failed = logs.filter(l => !l.success);
  
  if (failed.length > 0) {
    console.warn(`${failed.length} failed operations in last interval`);
    // Send to monitoring service
  }
}, 60000); // Every minute
```

### 4. Connection Pooling (for high-traffic apps)

```typescript
class MCPClientPool {
  private clients: MCPClient[] = [];
  private currentIndex = 0;
  private poolSize = 5;

  constructor() {
    for (let i = 0; i < this.poolSize; i++) {
      this.clients.push(new MCPClient({
        baseUrl: process.env.BODIGI_MCP_URL!,
        apiKey: process.env.BODIGI_API_KEY
      }));
    }
  }

  getClient(): MCPClient {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.poolSize;
    return client;
  }
}
```

### 5. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: 'Too many MCP requests, please try again later'
});

app.use('/api/mcp', mcpLimiter);
```

---

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify `BODIGI_API_KEY` or `BODIGI_OAUTH_TOKEN` is set correctly
   - Check if the key has expired

2. **Timeout Errors**
   - Increase `timeout` configuration
   - Check network connectivity

3. **Tool Not in Allowlist**
   - Add custom tools to allowlist in client config
   - Verify tool name spelling

4. **Security Validation Failed**
   - Review parameters for unsafe patterns
   - Check URL domains against allowlist

---

## Additional Resources

- [Client SDK API Reference](./README.md)
- [MCP Server Documentation](../../README.md)
- [Security Best Practices](./README.md#security-features)
- [Example Applications](./examples/)

---

## Support

For issues or questions:
- Open an issue on GitHub
- Check audit logs for debugging: `client.getAuditLogs()`
- Review security validation errors
