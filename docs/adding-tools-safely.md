# How to Add a Tool Safely

This guide explains how to safely add new tools to the BoDiGi MCP Server without compromising security.

## 🔒 Security Principles

**IMPORTANT:** This server follows a strict "no remote code installation" policy.

- ✅ Tools must be developed locally and added to the codebase
- ✅ All tools must include a manifest with risk assessment
- ✅ Tools are reviewed before deployment
- ❌ Remote code installation is **NOT** permitted
- ❌ Dynamic code loading from external sources is **NOT** allowed

## 📋 Prerequisites

Before adding a new tool:

1. **Identify the need**: Clearly define what capability is missing
2. **Check existing tools**: Use `needs_analyzer` to see if existing tools can meet your needs
3. **Review security implications**: Assess risks and data access requirements
4. **Plan dependencies**: List any external dependencies needed

## 🛠️ Step-by-Step Guide

### Step 1: Create the Tool Implementation

Create a new TypeScript file in `src/tools/` (e.g., `my-new-tool.ts`):

```typescript
import { z } from 'zod';

/**
 * My New Tool
 * Description of what this tool does
 */

export const myNewToolSchema = z.object({
  param1: z.string().describe('Description of parameter'),
  param2: z.number().optional().describe('Optional parameter')
});

export type MyNewToolInput = z.infer<typeof myNewToolSchema>;

export async function executeMyNewTool(input: MyNewToolInput): Promise<string> {
  const { param1, param2 } = input;
  
  // Implement your tool logic here
  
  return `Result of tool execution`;
}

export const myNewToolTool = {
  name: 'my_new_tool',
  description: 'Brief description of the tool',
  inputSchema: {
    type: 'object' as const,
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter'
      },
      param2: {
        type: 'number',
        description: 'Optional parameter (optional)'
      }
    },
    required: ['param1']
  }
};
```

### Step 2: Create the Tool Manifest

Create a manifest file in `src/tools/manifests/` (e.g., `my-new-tool.json`):

```json
{
  "name": "my_new_tool",
  "description": "Brief description of what the tool does",
  "category": "learning|automation|content|security|system",
  "scopes": [
    "scope:action"
  ],
  "risks": ["none|low|medium|high|critical"],
  "dependencies": [],
  "envRequirements": {
    "ENV_VAR_NAME": "Description of what this env var is for"
  },
  "capabilities": [
    "capability_1",
    "capability_2"
  ],
  "version": "1.0.0",
  "enabled": true
}
```

#### Manifest Field Descriptions

- **name**: Tool identifier (use snake_case)
- **description**: Clear, concise description of tool functionality
- **category**: One of: `learning`, `automation`, `content`, `security`, `system`
- **scopes**: List of permission scopes the tool requires
- **risks**: Array of risk levels the tool introduces
  - `none`: No security risks
  - `low`: Minimal risk (e.g., reading public data)
  - `medium`: Some risk (e.g., writing data, external API calls)
  - `high`: Significant risk (e.g., system modifications)
  - `critical`: Severe risk (e.g., code execution, credential access)
- **dependencies**: External packages required (must be installed via npm)
- **envRequirements**: Environment variables needed
- **capabilities**: List of capabilities this tool provides
- **version**: Semantic version (start with "1.0.0")
- **enabled**: Whether the tool is active (set to `false` initially)

### Step 3: Register the Tool

Update `src/index.ts`:

1. Import your tool:
```typescript
import { myNewToolTool, executeMyNewTool, myNewToolSchema } from './tools/my-new-tool.js';
```

2. Add to the tools list in `setupToolHandlers()`:
```typescript
const tools = [
  // ... existing tools ...
  myNewToolTool
];
```

3. Add to the switch statement:
```typescript
case 'my_new_tool': {
  const input = myNewToolSchema.parse(args);
  result = await executeMyNewTool(input);
  break;
}
```

### Step 4: Update Manifest Loader

Add your tool name to `src/tools/manifest-loader.ts`:

```typescript
const toolNames = [
  // ... existing tools ...
  'my-new-tool'
];
```

### Step 5: Add Tests

Create or update test file to validate your tool:

```typescript
// Test basic functionality
await sendRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'my_new_tool',
    arguments: {
      param1: 'test value'
    }
  }
});
```

### Step 6: Build and Test

```bash
# Build the project
npm run build

# Run tests
npm run test

# Test manually with your MCP client
npm start
```

### Step 7: Update Documentation

Update `README.md` to document your new tool:

```markdown
### N. My New Tool (`my_new_tool`)
Brief description of the tool.

**Parameters:**
- `param1` (string, required) - Description
- `param2` (number, optional) - Description

**Example:**
\`\`\`json
{
  "param1": "example",
  "param2": 42
}
\`\`\`
```

## 🔍 Security Checklist

Before enabling a new tool, verify:

- [ ] Tool only accesses necessary resources
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive information
- [ ] External dependencies are from trusted sources
- [ ] Rate limiting is implemented if needed
- [ ] Logging doesn't include sensitive data
- [ ] Manifest accurately reflects risks
- [ ] Environment variables are documented

## 🚫 What NOT to Do

### ❌ Remote Code Installation

**Never** implement features that:
- Download and execute code from URLs
- Use `eval()` or `Function()` with external input
- Dynamically load modules from untrusted sources
- Execute shell commands with user-controlled input

### ❌ Hardcoded Credentials

**Never** include:
- API keys in source code
- Passwords or tokens
- Private keys or certificates

Always use environment variables for sensitive configuration.

### ❌ Unvalidated Input

**Never** use user input without validation:
- Always use Zod schemas for input validation
- Sanitize strings used in system commands
- Validate URLs before fetching
- Check file paths before reading/writing

## 🎯 Tool Enablement Process

Once a tool is developed and tested:

1. **Code Review**: Submit for review by the team
2. **Security Audit**: Assess security implications
3. **Testing**: Validate in isolated environment
4. **Documentation**: Ensure complete documentation
5. **Enable**: Use the `enable_tool` command with admin key:

```json
{
  "tool_name": "my_new_tool",
  "admin_key": "your-admin-key"
}
```

## 📚 Additional Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Zod Schema Validation](https://zod.dev/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## 💡 Getting Help

If you need assistance:

1. Use `needs_analyzer` to identify existing capabilities
2. Review existing tool implementations for patterns
3. Check the MCP SDK documentation
4. Ask the team for guidance on security concerns

---

**Remember**: Security and reliability are paramount. When in doubt, ask for review before enabling a new tool.
