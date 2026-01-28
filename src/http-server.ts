#!/usr/bin/env node

import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { getOAuthService } from './auth/oauth.js';
import { authenticate, requireScope } from './middleware/auth.js';
import { createRateLimiter } from './middleware/rate-limit.js';

// Import all tools
import { executeAiTeaching, aiTeachingSchema, aiTeachingTool } from './tools/ai-teaching.js';
import { executeToolDiscovery, toolDiscoverySchema, toolDiscoveryTool } from './tools/tool-discovery.js';
import { executeWebFetch, webFetchSchema, webFetchTool } from './tools/web-fetch.js';
import { executeKnowledgeIngest, knowledgeIngestSchema, knowledgeIngestTool } from './tools/knowledge-ingest.js';
import { executeLessonQuizGen, lessonQuizGenSchema, lessonQuizGenTool } from './tools/lesson-quiz-gen.js';
import { executeBotKnowledgeUpdate, botKnowledgeUpdateSchema, botKnowledgeUpdateTool } from './tools/bot-knowledge-update.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Create rate limiters
const generalRateLimiter = createRateLimiter(60000, 100); // 100 requests per minute
const tokenRateLimiter = createRateLimiter(60000, 10); // 10 token requests per minute

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (no auth required, rate limited)
app.get('/health', generalRateLimiter, (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bodigi-mcp-server', version: '1.0.0' });
});

// OAuth token endpoint (no auth required, stricter rate limiting)
app.post('/oauth/token', tokenRateLimiter, async (req: Request, res: Response) => {
  try {
    const { client_id, client_secret, grant_type } = req.body;

    // Validate grant_type
    if (grant_type !== 'client_credentials') {
      res.status(400).json({ 
        error: 'unsupported_grant_type',
        message: 'Only client_credentials grant type is supported'
      });
      return;
    }

    // Validate required fields
    if (!client_id || !client_secret) {
      res.status(400).json({ 
        error: 'invalid_request',
        message: 'client_id and client_secret are required'
      });
      return;
    }

    // Authenticate and issue token
    const oauthService = getOAuthService();
    const tokenResponse = await oauthService.authenticateClient(client_id, client_secret);

    if (!tokenResponse) {
      res.status(401).json({ 
        error: 'invalid_client',
        message: 'Invalid client credentials'
      });
      return;
    }

    res.json(tokenResponse);
  } catch (error) {
    console.error('Token endpoint error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'An error occurred while processing the request'
    });
  }
});

// List available tools - requires tools:read scope
app.get('/list-tools', generalRateLimiter, authenticate, requireScope('tools:read'), (req: Request, res: Response) => {
  res.json({
    tools: [
      aiTeachingTool,
      toolDiscoveryTool,
      webFetchTool,
      knowledgeIngestTool,
      lessonQuizGenTool,
      botKnowledgeUpdateTool
    ]
  });
});

// Call a tool - requires tools:call scope
app.post('/call-tool', generalRateLimiter, authenticate, requireScope('tools:call'), async (req: Request, res: Response) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name) {
      res.status(400).json({ error: 'invalid_request', message: 'Tool name is required' });
      return;
    }

    let result: string;

    switch (name) {
      case 'ai_teaching': {
        const input = aiTeachingSchema.parse(args);
        result = await executeAiTeaching(input);
        break;
      }

      case 'tool_discovery': {
        const input = toolDiscoverySchema.parse(args);
        result = await executeToolDiscovery(input);
        break;
      }

      case 'web_fetch': {
        const input = webFetchSchema.parse(args);
        result = await executeWebFetch(input);
        break;
      }

      case 'knowledge_ingest': {
        const input = knowledgeIngestSchema.parse(args);
        result = await executeKnowledgeIngest(input);
        break;
      }

      case 'lesson_quiz_gen': {
        const input = lessonQuizGenSchema.parse(args);
        result = await executeLessonQuizGen(input);
        break;
      }

      case 'bot_knowledge_update': {
        const input = botKnowledgeUpdateSchema.parse(args);
        result = await executeBotKnowledgeUpdate(input);
        break;
      }

      default:
        res.status(404).json({ error: 'not_found', message: `Unknown tool: ${name}` });
        return;
    }

    res.json({ result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'invalid_arguments',
        message: 'Invalid tool arguments',
        details: error.errors
      });
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: 'execution_error',
      message: `Tool execution failed: ${errorMessage}`
    });
  }
});

// Jobs endpoint - requires jobs:run scope (placeholder for future job functionality)
app.post('/jobs/run', generalRateLimiter, authenticate, requireScope('jobs:run'), (req: Request, res: Response) => {
  res.json({ 
    message: 'Job execution endpoint - not yet implemented',
    status: 'placeholder'
  });
});

app.get('/jobs/status/:jobId', generalRateLimiter, authenticate, requireScope('jobs:run'), (req: Request, res: Response) => {
  res.json({ 
    message: 'Job status endpoint - not yet implemented',
    status: 'placeholder',
    jobId: req.params.jobId
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found', message: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'server_error', message: 'An unexpected error occurred' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BoDiGi MCP HTTP Server running on port ${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET  /health           - Health check (no auth)`);
  console.log(`   POST /oauth/token      - Get OAuth access token (no auth)`);
  console.log(`   GET  /list-tools       - List tools (requires tools:read)`);
  console.log(`   POST /call-tool        - Call a tool (requires tools:call)`);
  console.log(`   POST /jobs/run         - Run a job (requires jobs:run)`);
  console.log(`   GET  /jobs/status/:id  - Get job status (requires jobs:run)`);
  console.log(`\n🔒 Authentication: Bearer <api-key> or Bearer <jwt-token>`);
});
