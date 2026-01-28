# Tool Needs Detection System - Usage Examples

This document demonstrates the new tool needs detection system with practical examples.

## Example 1: New App Needs Analysis

When creating a new educational app, you can ask the system what tools you need:

```json
{
  "name": "needs_analyzer",
  "arguments": {
    "app_name": "CodeLearn",
    "app_description": "An interactive coding tutorial platform with quizzes and personalized learning paths",
    "requested_capabilities": [
      "lesson_generation",
      "quiz_generation",
      "adaptive_learning",
      "web_content_fetch",
      "progress_tracking"
    ]
  }
}
```

**Expected Response:**
```
# Tool Needs Analysis for "CodeLearn"

**App Description:** An interactive coding tutorial platform with quizzes and personalized learning paths

**Requested Capabilities:** 5

## 🎯 Recommended Tools (4)

### ai_teaching
- **Reason:** Provides 1 matching capability(ies): Provides adaptive AI teaching for various topics and skill levels
- **Capabilities Matched:** adaptive_learning
- **Risk Level:** none

### web_fetch
- **Reason:** Provides 1 matching capability(ies): Controlled web content fetching with safety checks
- **Capabilities Matched:** web_content_fetch
- **Risk Level:** medium

### lesson_quiz_gen
- **Reason:** Provides 2 matching capability(ies): Generate lessons and quizzes automatically
- **Capabilities Matched:** lesson_generation, quiz_generation
- **Risk Level:** none

## ❌ Missing Capabilities (1)

The following capabilities are not available in any existing tools:

- progress_tracking

**Recommendation:** You may need to develop custom tools for these capabilities.
See the documentation on "How to Add a Tool Safely" for guidance.
```

## Example 2: Checking What Tools Are Available

Use the enhanced `tool_discovery` to see all available tools with their manifest metadata:

```json
{
  "method": "tools/list"
}
```

**Response includes manifest metadata:**
```json
{
  "name": "ai_teaching",
  "description": "...",
  "inputSchema": {...},
  "metadata": {
    "category": "learning",
    "scopes": ["learning:read", "content:generate"],
    "risks": ["none"],
    "capabilities": [
      "adaptive_learning",
      "multi_level_teaching",
      "topic_explanation",
      "example_generation",
      "practice_exercises"
    ],
    "version": "1.0.0",
    "enabled": true
  }
}
```

## Example 3: Admin Tool Enablement

Safely enable a tool that's already installed locally:

### Scenario A: Invalid Admin Key (Security Check)
```json
{
  "name": "enable_tool",
  "arguments": {
    "tool_name": "lesson_quiz_gen",
    "admin_key": "wrong-key"
  }
}
```

**Response:**
```
# ❌ Authorization Failed

Invalid admin key. Tool enablement requires admin authorization.

**Security Notice:** This operation is restricted to prevent unauthorized tool installation.
```

### Scenario B: Non-existent Tool (Safety Check)
```json
{
  "name": "enable_tool",
  "arguments": {
    "tool_name": "remote_code_executor",
    "admin_key": "your-admin-key"
  }
}
```

**Response:**
```
# ❌ Tool Not Found

The tool "remote_code_executor" does not exist in the local /src/tools/ directory.

**Security Policy:** This server can only enable tools that are already installed locally. 
Remote code installation is not permitted.

**Available Tools:**
- ai_teaching
- tool_discovery
- web_fetch
- knowledge_ingest
- lesson_quiz_gen
- bot_knowledge_update
- needs_analyzer
- enable_tool
```

### Scenario C: Successful Tool Enablement
```json
{
  "name": "enable_tool",
  "arguments": {
    "tool_name": "ai_teaching",
    "admin_key": "default-admin-key-change-in-production"
  }
}
```

**Response:**
```
# ℹ️ Tool Already Enabled

**Tool:** ai_teaching
**Status:** Already enabled

This tool is already active and available for use.
```

## Example 4: Workflow for Adding a New Tool

Based on the needs analysis, if you need a capability that's not available:

1. **Create the tool** following the guide in `docs/adding-tools-safely.md`
2. **Create the manifest** in `src/tools/manifests/your-tool.json`
3. **Register the tool** in `src/index.ts`
4. **Build and test** the tool locally
5. **Enable the tool** using the `enable_tool` command with admin key

## Security Features Demonstrated

### 1. Admin Protection
- `enable_tool` requires a valid admin key
- Environment variable `BODIGI_ADMIN_KEY` can be used in production
- Default key is for development only

### 2. Local-Only Installation
- Cannot install tools from remote URLs
- Cannot execute remote code
- Only tools in `/src/tools/` can be enabled

### 3. Risk Assessment
- Every tool has a risk level in its manifest
- Risks are exposed in the tool list metadata
- Helps administrators make informed decisions

### 4. Capability Transparency
- All tool capabilities are documented in manifests
- Easy to see what each tool can do
- Helps with security auditing and compliance

## Configuration

Set the admin key in your environment:

```bash
export BODIGI_ADMIN_KEY="your-secure-admin-key"
```

Or in your MCP client configuration:

```json
{
  "mcpServers": {
    "bodigi": {
      "command": "node",
      "args": ["/path/to/bodigi-mcp-server/dist/index.js"],
      "env": {
        "BODIGI_ADMIN_KEY": "your-secure-admin-key"
      }
    }
  }
}
```

## Testing the System

Run the integration tests:

```bash
npm run test
```

Test individual features with custom scripts or MCP clients.

## Benefits

1. **Self-Discovery**: Apps can discover what tools they need automatically
2. **Safe Extension**: New tools can be added without compromising security
3. **Transparency**: All tool capabilities and risks are documented
4. **Controlled Access**: Admin protection prevents unauthorized changes
5. **No Remote Code**: Eliminates remote code execution vulnerabilities
