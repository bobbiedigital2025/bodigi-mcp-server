import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { loadConfig, getConfig } from './config/index.js';
import { initDatabase, auditDb } from './db/index.js';
import { initLogger, getLogger } from './utils/logger.js';
import cron from 'node-cron';
import { executeDailyLearn } from './jobs/daily-learn.js';

/**
 * HTTP Server for REST API endpoints
 * Provides tool execution via HTTP with authentication and rate limiting
 */

// Tool executors
import { executeAiTeaching, aiTeachingSchema } from './tools/ai-teaching.js';
import { executeToolDiscovery, toolDiscoverySchema } from './tools/tool-discovery.js';
import { executeWebFetch, webFetchSchema } from './tools/web-fetch.js';
import { executeKnowledgeIngest, knowledgeIngestSchema } from './tools/knowledge-ingest.js';
import { executeLessonQuizGen, lessonQuizGenSchema } from './tools/lesson-quiz-gen.js';
import {
  executeBotKnowledgeUpdate,
  botKnowledgeUpdateSchema,
} from './tools/bot-knowledge-update.js';
import { executeKnowledgeQuery, knowledgeQuerySchema } from './tools/knowledge-query.js';

// Tool registry
const TOOL_REGISTRY = {
  ai_teaching: { schema: aiTeachingSchema, executor: executeAiTeaching },
  tool_discovery: { schema: toolDiscoverySchema, executor: executeToolDiscovery },
  web_fetch: { schema: webFetchSchema, executor: executeWebFetch },
  knowledge_ingest: { schema: knowledgeIngestSchema, executor: executeKnowledgeIngest },
  lesson_quiz_gen: { schema: lessonQuizGenSchema, executor: executeLessonQuizGen },
  bot_knowledge_update: { schema: botKnowledgeUpdateSchema, executor: executeBotKnowledgeUpdate },
  knowledge_query: { schema: knowledgeQuerySchema, executor: executeKnowledgeQuery },
};

// Extended Request type with custom properties
interface AuthRequest extends Request {
  requestId?: string;
  apiKeyHint?: string;
}

/**
 * Request ID middleware
 */
function requestIdMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * API Key Authentication middleware
 */
function apiKeyAuth(req: AuthRequest, res: Response, next: NextFunction): Response | void {
  const config = getConfig();
  const logger = getLogger();

  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  // Check if API keys are configured
  if (config.MCP_API_KEYS.length === 0) {
    logger.warn('No API keys configured - running in open mode');
    req.apiKeyHint = 'none';
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(
      { requestId: req.requestId, path: req.path },
      'Missing or invalid authorization header'
    );
    return res.status(401).json({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header. Use: Authorization: Bearer <api-key>',
      },
    });
  }

  const apiKey = authHeader.substring(7);

  if (!config.MCP_API_KEYS.includes(apiKey)) {
    logger.warn({ requestId: req.requestId, path: req.path }, 'Invalid API key');
    return res.status(403).json({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid API key',
      },
    });
  }

  // Store hint of API key (first 4 chars)
  req.apiKeyHint = apiKey.substring(0, 4) + '****';

  logger.info(
    { requestId: req.requestId, apiKeyHint: req.apiKeyHint, path: req.path },
    'Request authenticated'
  );
  next();
}

/**
 * Centralized error handler
 */
function errorHandler(err: Error, req: AuthRequest, res: Response, _next: NextFunction): void {
  const logger = getLogger();

  logger.error(
    {
      error: err.message,
      stack: err.stack,
      requestId: req.requestId,
      path: req.path,
    },
    'Request error'
  );

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      requestId: req.requestId,
    },
  });
}

/**
 * Create and configure Express app
 */
export function createHttpServer(): express.Application {
  const app = express();
  const config = getConfig();
  const logger = getLogger();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin:
        config.NODE_ENV === 'production'
          ? false // In production, configure specific origins
          : true, // In development, allow all
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));

  // Custom middleware
  app.use(requestIdMiddleware);

  // Health check (public)
  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'bodigi-mcp-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Apply auth middleware to protected routes
  app.use(apiKeyAuth);

  // List available tools
  app.get('/list-tools', (req: AuthRequest, res) => {
    const tools = Object.entries(TOOL_REGISTRY).map(([name, { schema }]) => {
      const shape = schema.shape || schema._def?.shape?.();
      const properties: Record<string, any> = {};

      if (shape) {
        Object.entries(shape).forEach(([key, value]: [string, any]) => {
          properties[key] = {
            type: value._def?.typeName?.toLowerCase() || 'string',
            description: value._def?.description || '',
          };
        });
      }

      return {
        name,
        description: `Execute ${name} tool`,
        inputSchema: {
          type: 'object',
          properties,
          required: Object.keys(properties),
        },
      };
    });

    res.json({ ok: true, tools });
  });

  // Call a tool
  app.post('/call-tool', async (req: AuthRequest, res) => {
    const { tool, params } = req.body;

    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing or invalid "tool" parameter',
        },
      });
    }

    const toolDef = TOOL_REGISTRY[tool as keyof typeof TOOL_REGISTRY];

    if (!toolDef) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool "${tool}" not found`,
        },
      });
    }

    try {
      // Validate params
      const validatedParams = toolDef.schema.parse(params || {}) as any;

      // Execute tool
      const result = await toolDef.executor(validatedParams);

      // Log to audit
      auditDb.insert({
        api_key_hint: req.apiKeyHint || 'none',
        tool_name: tool,
        params_json: JSON.stringify(params),
        status: 'success',
      });

      res.json({
        ok: true,
        result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error({ error, tool, requestId: req.requestId }, 'Tool execution failed');

      // Log to audit
      auditDb.insert({
        api_key_hint: req.apiKeyHint || 'none',
        tool_name: tool,
        params_json: JSON.stringify(params),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(400).json({
        ok: false,
        error: {
          code: 'TOOL_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Tool execution failed',
          requestId: req.requestId,
        },
      });
    }
  });

  // Jobs endpoint - Daily learning
  app.post('/jobs/daily-learn', async (req: AuthRequest, res) => {
    logger.info({ requestId: req.requestId }, 'Triggering daily learning job');

    try {
      const result = await executeDailyLearn();

      res.json({
        ok: true,
        result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error({ error, requestId: req.requestId }, 'Daily learning job failed');

      res.status(500).json({
        ok: false,
        error: {
          code: 'JOB_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Job execution failed',
          requestId: req.requestId,
        },
      });
    }
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start HTTP server
 */
export async function startHttpServer(): Promise<void> {
  // Initialize
  const config = loadConfig();
  const logger = initLogger();
  const db = initDatabase();

  logger.info('Starting BoDiGi MCP HTTP Server...');
  logger.info(
    {
      config: {
        port: config.PORT,
        nodeEnv: config.NODE_ENV,
        apiKeysConfigured: config.MCP_API_KEYS.length,
        allowedDomains: config.ALLOWED_DOMAINS.length,
        cronEnabled: config.CRON_ENABLED,
      },
    },
    'Configuration loaded'
  );

  // Create Express app
  const app = createHttpServer();

  // Start server
  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'HTTP Server listening');
  });

  // Setup cron jobs if enabled
  if (config.CRON_ENABLED) {
    logger.info({ schedule: config.CRON_SCHEDULE_DAILY_LEARN }, 'Scheduling daily learning job');

    cron.schedule(config.CRON_SCHEDULE_DAILY_LEARN, async () => {
      logger.info('Running scheduled daily learning job');
      try {
        await executeDailyLearn();
      } catch (error) {
        logger.error({ error }, 'Scheduled daily learning job failed');
      }
    });
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    db.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down gracefully...');
    db.close();
    process.exit(0);
  });
}

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startHttpServer().catch((error) => {
    console.error('Fatal error starting HTTP server:', error);
    process.exit(1);
  });
}
