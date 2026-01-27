# Contributing to BoDiGi MCP Server

Thank you for your interest in contributing to the BoDiGi MCP Server! This document provides guidelines for extending and improving the server.

## Adding New Tools

To add a new tool to the server, follow these steps:

### 1. Create the Tool File

Create a new file in `src/tools/` directory (e.g., `src/tools/my-new-tool.ts`):

```typescript
import { z } from 'zod';

// Define the input schema using Zod
export const myNewToolSchema = z.object({
  param1: z.string().describe('Description of param1'),
  param2: z.number().optional().describe('Optional parameter')
});

export type MyNewToolInput = z.infer<typeof myNewToolSchema>;

// Implement the tool execution logic
export async function executeMyNewTool(input: MyNewToolInput): Promise<string> {
  const { param1, param2 = 0 } = input;
  
  // Your tool logic here
  const result = `Processing ${param1} with value ${param2}`;
  
  return result;
}

// Export the tool definition for MCP
export const myNewToolTool = {
  name: 'my_new_tool',
  description: 'Brief description of what this tool does',
  inputSchema: {
    type: 'object' as const,
    properties: {
      param1: {
        type: 'string',
        description: 'Description of param1'
      },
      param2: {
        type: 'number',
        description: 'Optional parameter'
      }
    },
    required: ['param1']
  }
};
```

### 2. Register the Tool in Main Server

Edit `src/index.ts` to import and register your new tool:

```typescript
// Add import
import { myNewToolTool, executeMyNewTool, myNewToolSchema } from './tools/my-new-tool.js';

// Add to tools list in ListToolsRequestSchema handler
this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools
    myNewToolTool
  ],
}));

// Add case in CallToolRequestSchema handler
case 'my_new_tool': {
  const input = myNewToolSchema.parse(args);
  result = await executeMyNewTool(input);
  break;
}
```

### 3. Update Tool Discovery

Add your tool to the `availableTools` array in `src/tools/tool-discovery.ts`:

```typescript
{
  name: 'my_new_tool',
  category: 'automation', // or 'learning', 'content'
  description: 'Brief description',
  capabilities: ['Capability 1', 'Capability 2']
}
```

### 4. Build and Test

```bash
# Build the project
npm run build

# Run tests
npm test

# Test manually
npm start
```

## Code Style Guidelines

- Use TypeScript for all code
- Use Zod for schema validation
- Follow existing naming conventions
- Add descriptive comments for complex logic
- Keep tool files focused and modular
- Return markdown-formatted strings for rich output

## Error Handling

- Validate all inputs using Zod schemas
- Provide helpful error messages
- Use `McpError` for MCP-specific errors
- Handle edge cases gracefully

## Testing

- Add integration tests for new tools
- Ensure all existing tests pass
- Test with real MCP clients when possible

## Documentation

- Update README.md with new tool documentation
- Include example usage
- Document all parameters and return values

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request with clear description

## Questions?

Open an issue for discussion or questions about contributing.
