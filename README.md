# BoDiGi MCP Server

bodigi-mcp-server is a shared MCP (Model Context Protocol) tool server that powers learning, automation, and adaptive intelligence across all BoDiGi applications.

## 📌 What This Repo Is

This server acts as the **central brain** for:
- 🎓 **AI Teaching** - Adaptive learning and personalized instruction
- 🔍 **Tool Discovery** - Explore available capabilities
- 🌐 **Controlled Web Fetching** - Safe content retrieval
- 📚 **Daily Knowledge Ingestion** - Multi-source learning
- ✏️ **Lesson + Quiz Generation** - Automated educational content
- 🤖 **Bot Knowledge Updates** - Keep AI assistants current

Every BoDiGi app connects to this server to self-teach, improve UX, and keep AI assistants up to date—without duplicating logic in each app.

## 📦 Packages

This repository contains:
- **bodigi-mcp-server** - The main MCP server implementation
- **[@bodigi/mcp-client](packages/mcp-client)** - Lightweight client SDK for connecting from any Node/TS app

## 🚀 Installation

### MCP Server

```bash
npm install bodigi-mcp-server
```

### Client SDK

```bash
npm install @bodigi/mcp-client
```

## 🛠️ Usage

### As a Standalone Server

```bash
npm start
```

### In Claude Desktop or Other MCP Clients

Add to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bodigi": {
      "command": "node",
      "args": ["/path/to/bodigi-mcp-server/dist/index.js"]
    }
  }
}
```

### Using the Client SDK from Your App

```typescript
import { MCPClient } from '@bodigi/mcp-client';

const client = new MCPClient({
  baseUrl: 'https://mcp.bodigi.com',
  apiKey: process.env.BODIGI_API_KEY
});

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool('ai_teaching', {
  topic: 'JavaScript Promises',
  level: 'intermediate'
});
```

See the [Client SDK documentation](packages/mcp-client/README.md) for more details.

### Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## 🎯 Available Tools

### 1. AI Teaching (`ai_teaching`)
Provides adaptive AI teaching for various topics and skill levels.

**Parameters:**
- `topic` (string, required) - The topic to teach
- `level` (string, required) - Learning level: `beginner`, `intermediate`, or `advanced`
- `format` (string, optional) - Teaching format: `explanation`, `example`, or `practice`

**Example:**
```json
{
  "topic": "JavaScript Promises",
  "level": "intermediate",
  "format": "example"
}
```

### 2. Tool Discovery (`tool_discovery`)
Discover available MCP tools and their capabilities.

**Parameters:**
- `category` (string, optional) - Filter by category: `learning`, `automation`, `content`, or `all`
- `search` (string, optional) - Search term to filter tools

**Example:**
```json
{
  "category": "learning",
  "search": "quiz"
}
```

### 3. Web Fetch (`web_fetch`)
Controlled web content fetching with safety checks.

**Parameters:**
- `url` (string, required) - URL to fetch (must be from approved domains)
- `extractType` (string, optional) - Content type: `text`, `metadata`, or `links`
- `maxLength` (number, optional) - Maximum content length in characters

**Example:**
```json
{
  "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "extractType": "text",
  "maxLength": 3000
}
```

### 4. Knowledge Ingest (`knowledge_ingest`)
Ingest and process knowledge from multiple sources.

**Parameters:**
- `source` (string, required) - Source type: `rss`, `api`, `document`, or `manual`
- `content` (string, required) - Content to ingest
- `category` (string, optional) - Knowledge category/topic
- `priority` (string, optional) - Priority level: `low`, `medium`, or `high`

**Example:**
```json
{
  "source": "manual",
  "content": "Important information about new AI techniques...",
  "category": "ai-research",
  "priority": "high"
}
```

### 5. Lesson & Quiz Generation (`lesson_quiz_gen`)
Generate lessons and quizzes automatically for any topic.

**Parameters:**
- `topic` (string, required) - The topic for lesson/quiz
- `type` (string, required) - What to generate: `lesson`, `quiz`, or `both`
- `difficulty` (string, optional) - Difficulty level: `easy`, `medium`, or `hard`
- `questionCount` (number, optional) - Number of questions (1-20, for quizzes)

**Example:**
```json
{
  "topic": "Python Data Structures",
  "type": "both",
  "difficulty": "medium",
  "questionCount": 10
}
```

### 6. Bot Knowledge Update (`bot_knowledge_update`)
Update bot knowledge bases with new information.

**Parameters:**
- `botId` (string, required) - The bot identifier to update
- `knowledge` (string, required) - New knowledge to add
- `operation` (string, required) - Operation type: `add`, `update`, or `remove`
- `tags` (array, optional) - Tags for categorization

**Example:**
```json
{
  "botId": "assistant-001",
  "knowledge": "Latest best practices for React hooks...",
  "operation": "add",
  "tags": ["react", "frontend", "javascript"]
}
```

## 🏗️ Architecture

```
bodigi-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   └── tools/                # Tool implementations
│       ├── ai-teaching.ts
│       ├── tool-discovery.ts
│       ├── web-fetch.ts
│       ├── knowledge-ingest.ts
│       ├── lesson-quiz-gen.ts
│       └── bot-knowledge-update.ts
├── dist/                     # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
```

## 🔒 Security

- Web fetching is restricted to approved domains
- Content validation on all inputs
- Rate limiting ready (implement as needed)
- Version control for knowledge updates

## 🤝 Contributing

This server is designed to be extended. To add new tools:

1. Create a new tool file in `src/tools/`
2. Define the tool schema using Zod
3. Implement the execution function
4. Export the tool definition
5. Register it in `src/index.ts`

## 📄 License

MIT

## 🌟 BoDiGi Ecosystem

This server is part of the BoDiGi ecosystem, providing shared intelligence across all BoDiGi applications.
