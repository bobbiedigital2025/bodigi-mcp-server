# Changelog

All notable changes to the BoDiGi MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-27

### Added
- Initial release of BoDiGi MCP Server
- AI Teaching tool for adaptive learning experiences
- Tool Discovery for exploring available capabilities
- Web Fetch tool with controlled, safe content retrieval
- Knowledge Ingest for daily knowledge processing from multiple sources
- Lesson and Quiz Generation for automated educational content
- Bot Knowledge Update tool for maintaining AI assistant knowledge bases
- TypeScript-based implementation with full type safety
- Zod schema validation for all tool inputs
- Comprehensive README with usage examples
- Integration test suite
- Contributing guidelines
- MIT License

### Features
- **AI Teaching**: Support for beginner, intermediate, and advanced levels
- **Tool Discovery**: Category filtering and search capabilities
- **Web Fetch**: Domain whitelist for security
- **Knowledge Ingest**: Multi-source support (RSS, API, documents, manual)
- **Lesson/Quiz Gen**: Customizable difficulty and question counts
- **Bot Knowledge**: Version-controlled knowledge updates

### Technical
- MCP SDK v1.0.4 integration
- StdioServerTransport for communication
- Modular tool architecture
- Error handling with McpError
- Build system with TypeScript compiler
