# BoDiGi MCP Server

**Production-ready MCP (Model Context Protocol) tool server** that powers learning, automation, and adaptive intelligence across all BoDiGi applications.

[![CI](https://github.com/bobbiedigital2025/bodigi-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/bobbiedigital2025/bodigi-mcp-server/actions/workflows/ci.yml)

## 📌 What This Is

A secure, production-hardened MCP server that acts as the **central brain** for:

- 🎓 **AI Teaching** - Adaptive learning and personalized instruction
- 🔍 **Tool Discovery** - Explore available capabilities
- 🌐 **SSRF-Safe Web Fetching** - Secure content retrieval with allowlists
- 📚 **Knowledge Management** - Persistent storage and querying
- 🔄 **Daily Learning** - Automated knowledge ingestion from sources
- ✏️ **Lesson + Quiz Generation** - Automated educational content
- 🤖 **Bot Knowledge Updates** - Keep AI assistants current
- 🔐 **API Security** - Key-based authentication and audit logging

## ✨ Key Features

### Security First
- ✅ SSRF-protected web fetching with allowlist enforcement
- ✅ Private IP range blocking (127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, etc.)
- ✅ API key authentication for all protected endpoints
- ✅ Rate limiting and request throttling
- ✅ Helmet.js security headers
- ✅ Comprehensive audit logging

### Production Ready
- ✅ Persistent SQLite database (PostgreSQL optional)
- ✅ Structured logging with Pino
- ✅ Docker support with health checks
- ✅ Configurable via environment variables
- ✅ Scheduled jobs with node-cron
- ✅ TypeScript with strict mode
- ✅ CI/CD with GitHub Actions

### Developer Friendly
- ✅ Dual mode: MCP stdio + HTTP REST API
- ✅ Comprehensive error handling
- ✅ Request ID tracking
- ✅ ESLint + Prettier configured
- ✅ Auto-generated tool registry

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/bobbiedigital2025/bodigi-mcp-server.git
cd bodigi-mcp-server

# Install dependencies
npm install

# Create your environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set MCP_API_KEYS for security

# Build the project
npm run build

# Start the HTTP server
npm run start:http
```

The server will start on http://localhost:3000 by default.

### Using with MCP Clients (Claude Desktop, etc.)

Add to your MCP client configuration:

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

## 🔧 Configuration

All configuration is done via environment variables. See `.env.example` for all options:

### Required Configuration

```bash
# API Keys (comma-separated)
MCP_API_KEYS=your-secret-key-1,your-secret-key-2

# Allowed domains for web fetching (comma-separated)
ALLOWED_DOMAINS=wikipedia.org,github.com,.edu,.gov
```

### Optional Configuration

```bash
# Server
PORT=3000
NODE_ENV=development

# Fetch Security
FETCH_TIMEOUT_MS=10000
MAX_FETCH_BYTES=1048576

# Database
SQLITE_PATH=./data/bodigi.db
# DATABASE_URL=postgresql://user:pass@host:5432/db

# Logging
LOG_LEVEL=info

# Scheduled Jobs
CRON_ENABLED=false
CRON_SCHEDULE_DAILY_LEARN=0 2 * * *

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🎯 Available Tools

### 1. Knowledge Ingest (`knowledge_ingest`)
Ingest and persist knowledge from various sources.

**Parameters:**
- `source` (required): `rss`, `api`, `document`, or `manual`
- `content` (required): Content to ingest
- `category` (optional): Knowledge category
- `priority` (optional): `low`, `medium`, or `high`

### 2. Knowledge Query (`knowledge_query`)
Search the knowledge base.

**Parameters:**
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `keyword` (optional): Search term
- `limit` (optional): Max results (1-100)

### 3. Web Fetch (`web_fetch`)
SSRF-safe web content fetching.

**Parameters:**
- `url` (required): URL to fetch (must be from allowed domains)
- `extractType` (optional): `text`, `metadata`, or `links`
- `maxLength` (optional): Max content length

### 4. AI Teaching (`ai_teaching`)
Adaptive teaching for various topics.

**Parameters:**
- `topic` (required): The topic to teach
- `level` (required): `beginner`, `intermediate`, or `advanced`
- `format` (optional): `explanation`, `example`, or `practice`

### 5. Tool Discovery (`tool_discovery`)
Discover available tools.

**Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search term

### 6. Lesson/Quiz Generation (`lesson_quiz_gen`)
Generate lessons and quizzes.

**Parameters:**
- `topic` (required): Topic for content
- `type` (required): `lesson`, `quiz`, or `both`
- `difficulty` (optional): `easy`, `medium`, or `hard`
- `questionCount` (optional): Number of questions (1-20)

### 7. Bot Knowledge Update (`bot_knowledge_update`)
Update bot knowledge bases.

**Parameters:**
- `botId` (required): Bot identifier
- `knowledge` (required): Knowledge to add
- `operation` (required): `add`, `update`, or `remove`
- `tags` (optional): Tags array

## 🌐 HTTP API

### Health Check (Public)
```bash
GET /health
```

### List Tools (Protected)
```bash
GET /list-tools
Authorization: Bearer YOUR_API_KEY
```

### Call Tool (Protected)
```bash
POST /call-tool
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "tool": "knowledge_ingest",
  "params": {
    "source": "manual",
    "content": "Important information...",
    "category": "ai-research",
    "priority": "high"
  }
}
```

### Daily Learning Job (Protected)
```bash
POST /jobs/daily-learn
Authorization: Bearer YOUR_API_KEY
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
docker build -t bodigi-mcp-server .

# Run container
docker run -d \
  -p 3000:3000 \
  -e MCP_API_KEYS=your-secret-key \
  -e ALLOWED_DOMAINS=wikipedia.org,github.com \
  -v $(pwd)/data:/app/data \
  --name bodigi-mcp \
  bodigi-mcp-server
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  bodigi-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_API_KEYS=your-secret-key
      - ALLOWED_DOMAINS=wikipedia.org,github.com,.edu
      - CRON_ENABLED=true
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## ☁️ Deploying to Render

1. **Create a new Web Service** on [Render](https://render.com)
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:http`
   - **Environment Variables:**
     - `MCP_API_KEYS`: Your API keys (comma-separated)
     - `ALLOWED_DOMAINS`: Allowed domains for fetching
     - `NODE_ENV`: `production`
     - `CRON_ENABLED`: `true` (optional)
4. **Add a disk** for persistent storage:
   - Mount path: `/app/data`
   - Size: 1GB+

The server will automatically use the `PORT` environment variable provided by Render.

## 🔒 Security

### SSRF Protection
- Blocks private IP ranges (RFC 1918)
- Blocks localhost and link-local addresses
- Blocks cloud metadata IPs
- Enforces domain allowlist
- Sets timeout and size limits

### Authentication
- API key required for all protected endpoints
- Keys stored securely in environment
- Failed auth attempts logged
- Request tracking with unique IDs

### Audit Logging
All tool calls are logged to the database:
- API key hint
- Tool name and parameters
- Timestamp
- Success/failure status

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build
npm run build

# Run in development mode (stdio)
npm run dev

# Run HTTP server in development
npm run dev:http
```

## 🤝 Contributing

### Adding a New Tool

1. Create a new file in `src/tools/your-tool.ts`:

```typescript
import { z } from 'zod';

export const yourToolSchema = z.object({
  param1: z.string().describe('Description'),
  param2: z.number().optional(),
});

export type YourToolInput = z.infer<typeof yourToolSchema>;

export async function executeYourTool(input: YourToolInput): Promise<string> {
  // Implementation
  return 'Result';
}

export const yourToolTool = {
  name: 'your_tool',
  description: 'What your tool does',
  inputSchema: {
    type: 'object' as const,
    properties: {
      param1: {
        type: 'string',
        description: 'Description',
      },
    },
    required: ['param1'],
  },
};
```

2. Register in `src/index.ts` (for MCP)
3. Register in `src/http-server.ts` (for HTTP API)
4. Run `npm run build` and test

### Adding an API Key

1. Generate a secure random key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to `.env`:
   ```bash
   MCP_API_KEYS=existing-key,new-key-here
   ```

3. Restart the server

## 📝 License

MIT

## 🌟 BoDiGi Ecosystem

This server is part of the BoDiGi ecosystem, providing shared intelligence across all BoDiGi applications.

---

**Built with ❤️ by BoDiGi**
