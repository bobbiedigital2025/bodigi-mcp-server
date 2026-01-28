#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

// Import all tools
import { aiTeachingTool, executeAiTeaching, aiTeachingSchema } from './tools/ai-teaching.js';
import { toolDiscoveryTool, executeToolDiscovery, toolDiscoverySchema } from './tools/tool-discovery.js';
import { webFetchTool, executeWebFetch, webFetchSchema } from './tools/web-fetch.js';
import { knowledgeIngestTool, executeKnowledgeIngest, knowledgeIngestSchema } from './tools/knowledge-ingest.js';
import { lessonQuizGenTool, executeLessonQuizGen, lessonQuizGenSchema } from './tools/lesson-quiz-gen.js';
import { botKnowledgeUpdateTool, executeBotKnowledgeUpdate, botKnowledgeUpdateSchema } from './tools/bot-knowledge-update.js';
import { needsAnalyzerTool, executeNeedsAnalyzer, needsAnalyzerSchema } from './tools/needs-analyzer.js';
import { enableToolTool, executeEnableTool, enableToolSchema } from './tools/enable-tool.js';

// Import manifest loader
import { loadAllManifests } from './tools/manifest-loader.js';

/**
 * BoDiGi MCP Server
 * Central brain for learning, automation, and adaptive intelligence
 */
class BodigiMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'bodigi-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // List available tools with manifest metadata
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const manifests = loadAllManifests();
      const tools = [
        aiTeachingTool,
        toolDiscoveryTool,
        webFetchTool,
        knowledgeIngestTool,
        lessonQuizGenTool,
        botKnowledgeUpdateTool,
        needsAnalyzerTool,
        enableToolTool
      ];
      
      // Enhance tools with manifest metadata
      const enhancedTools = tools.map(tool => {
        const manifest = manifests.get(tool.name);
        if (manifest) {
          return {
            ...tool,
            metadata: {
              category: manifest.category,
              scopes: manifest.scopes,
              risks: manifest.risks,
              capabilities: manifest.capabilities,
              version: manifest.version,
              enabled: manifest.enabled
            }
          };
        }
        return tool;
      });
      
      return { tools: enhancedTools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
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

          case 'needs_analyzer': {
            const input = needsAnalyzerSchema.parse(args);
            result = await executeNeedsAnalyzer(input);
            break;
          }

          case 'enable_tool': {
            const input = enableToolSchema.parse(args);
            result = await executeEnableTool(input);
            break;
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log server start to stderr so it doesn't interfere with MCP protocol
    console.error('BoDiGi MCP Server running on stdio');
    console.error('Server capabilities: AI Teaching, Tool Discovery, Web Fetch, Knowledge Ingest, Lesson/Quiz Gen, Bot Knowledge Update, Needs Analyzer, Enable Tool');
  }
}

// Start the server
const server = new BodigiMcpServer();
server.run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
