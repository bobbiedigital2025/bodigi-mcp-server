# OAuth2 Client Credentials Authentication

This document describes the OAuth2 Client Credentials authentication layer for the BoDiGi MCP Server.

## Overview

The BoDiGi MCP Server supports two authentication methods:

1. **API Key Authentication** (backward compatible) - Simple Bearer token authentication
2. **OAuth2 Client Credentials** (new) - Short-lived JWT tokens with scope-based authorization

## Quick Start

### 1. Start the HTTP Server

```bash
npm run start:http
```

The server will start on port 3000 (or the port specified in the `PORT` environment variable).

### 2. Create an OAuth Client

```bash
npm run oauth:create -- --scopes tools:read,tools:call,jobs:run
```

This will output:
```
✅ OAuth client created successfully!

Client ID:      client_1234567890_abc123
Client Secret:  xyzabc123def456...
Scopes:         tools:read, tools:call, jobs:run

⚠️  IMPORTANT: Save the client secret now! It cannot be retrieved later.
```

### 3. Get an Access Token

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "client_1234567890_abc123",
    "client_secret": "xyzabc123def456..."
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scopes": ["tools:read", "tools:call", "jobs:run"]
}
```

### 4. Use the Access Token

```bash
curl -X GET http://localhost:3000/list-tools \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Authentication Methods

### API Key Authentication (Backward Compatible)

The server accepts any Bearer token that is not a valid JWT as an API key:

```bash
curl -X GET http://localhost:3000/list-tools \
  -H "Authorization: Bearer my-api-key-123"
```

API keys have **full access** to all endpoints and are not subject to scope restrictions.

### OAuth2 JWT Authentication

OAuth2 tokens are short-lived (15 minutes) and enforce scope-based authorization:

```bash
curl -X GET http://localhost:3000/list-tools \
  -H "Authorization: Bearer <jwt-token>"
```

## Scopes

The following scopes are supported:

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| `tools:read` | Read tool information | `GET /list-tools` |
| `tools:call` | Execute tools | `POST /call-tool` |
| `jobs:run` | Run and manage jobs | `POST /jobs/run`, `GET /jobs/status/:id` |

## Endpoints

### Public Endpoints (No Authentication)

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "bodigi-mcp-server",
  "version": "1.0.0"
}
```

#### POST /oauth/token
Obtain an OAuth2 access token using client credentials.

**Request:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "client_1234567890_abc123",
  "client_secret": "xyzabc123def456..."
}
```

**Response (Success):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scopes": ["tools:read", "tools:call", "jobs:run"]
}
```

**Response (Error):**
```json
{
  "error": "invalid_client",
  "message": "Invalid client credentials"
}
```

### Protected Endpoints (Require Authentication)

#### GET /list-tools
List available tools. Requires `tools:read` scope.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tools": [
    {
      "name": "ai_teaching",
      "description": "Provides adaptive AI teaching...",
      "inputSchema": { ... }
    },
    ...
  ]
}
```

#### POST /call-tool
Execute a tool. Requires `tools:call` scope.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "tool_discovery",
  "arguments": {
    "category": "learning"
  }
}
```

**Response:**
```json
{
  "result": "Tool discovery results..."
}
```

#### POST /jobs/run
Run a job (placeholder). Requires `jobs:run` scope.

**Headers:**
```
Authorization: Bearer <token>
```

#### GET /jobs/status/:jobId
Get job status (placeholder). Requires `jobs:run` scope.

**Headers:**
```
Authorization: Bearer <token>
```

## OAuth Client Management

### Create a Client

```bash
npm run oauth:create -- --scopes tools:read,tools:call,jobs:run
```

Optional: Specify a custom client ID:
```bash
npm run oauth:create -- --scopes tools:read,tools:call --client-id my-custom-client
```

### List Clients

```bash
npm run oauth:list
```

Output:
```
📋 OAuth Clients:

Client ID                                Scopes                                   Created At
----------------------------------------------------------------------------------------------------
client_1234567890_abc123                 tools:read,tools:call,jobs:run          2026-01-28T13:52:39.622Z
my-custom-client                         tools:read,tools:call                   2026-01-28T14:00:00.000Z
```

### Delete a Client

```bash
npm run oauth:delete -- --client-id client_1234567890_abc123
```

## Security Best Practices

### JWT Secret

The JWT secret is used to sign and verify access tokens. In production:

1. Set the `JWT_SECRET` environment variable:
   ```bash
   export JWT_SECRET="your-strong-random-secret-here"
   ```

2. Use a strong, randomly generated secret (at least 32 characters)

3. Never commit the secret to version control

4. Rotate the secret periodically

### Client Secrets

- Client secrets are hashed using bcrypt before storage
- The plain secret is only shown once during client creation
- Treat client secrets like passwords - store them securely
- Rotate client secrets periodically
- Delete unused clients

### Token Expiration

- Access tokens expire after 15 minutes
- Clients must request a new token when the current one expires
- Expired tokens are automatically rejected

### Scope Principle

- Grant clients only the scopes they need (principle of least privilege)
- Review and audit client scopes regularly
- Create separate clients for different use cases

## Database

OAuth clients are stored in SQLite database at `./data/bodigi.db`.

### Schema

```sql
CREATE TABLE oauth_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL,
  scopes TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Backup

Backup the database file regularly:
```bash
cp data/bodigi.db data/bodigi.db.backup
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

Common error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_request` | 400 | Missing or invalid parameters |
| `invalid_arguments` | 400 | Invalid tool arguments |
| `unauthorized` | 401 | Missing or invalid authentication |
| `invalid_client` | 401 | Invalid client credentials |
| `forbidden` | 403 | Insufficient permissions/scopes |
| `not_found` | 404 | Endpoint or resource not found |
| `unsupported_grant_type` | 400 | Only client_credentials is supported |
| `execution_error` | 500 | Tool execution failed |
| `server_error` | 500 | Internal server error |

## Testing

Run the OAuth integration tests:

```bash
npm run test:oauth
```

This will:
1. Start the HTTP server
2. Create OAuth clients
3. Test token generation
4. Test protected endpoints
5. Test scope enforcement
6. Verify backward compatibility with API keys

## Migration from API Keys

If you're currently using API keys:

1. **No immediate action required** - API keys continue to work
2. Gradually migrate to OAuth2 for better security:
   - Create OAuth clients for each service/application
   - Replace API key Bearer tokens with OAuth JWT tokens
   - Assign appropriate scopes to each client
3. Eventually, you can disable API key support by modifying the authentication middleware

## Examples

### Node.js Client Example

```javascript
import fetch from 'node-fetch';

class BodigiClient {
  constructor(clientId, clientSecret, baseUrl = 'http://localhost:3000') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    
    return this.token;
  }

  async callTool(name, args) {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}/call-tool`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, arguments: args })
    });
    return response.json();
  }
}
```

## Troubleshooting

### "Invalid client credentials" error
- Verify the client_id and client_secret are correct
- Check that the client exists: `npm run oauth:list`
- Ensure you're using the original secret (not the hash)

### "Missing required scope" error
- Check the token's scopes match the endpoint requirements
- Create a new client with appropriate scopes if needed
- Remember: API keys bypass scope checks

### "JWT malformed" or token verification errors
- Ensure the token hasn't expired (15-minute lifetime)
- Request a new token if expired
- Verify the JWT_SECRET hasn't changed on the server

### Database connection errors
- Ensure the `data/` directory exists
- Check file permissions on the database file
- Verify SQLite is properly installed

## Additional Resources

- [OAuth 2.0 Client Credentials Grant](https://oauth.net/2/grant-types/client-credentials/)
- [JWT.io - Token Debugger](https://jwt.io/)
- [BoDiGi MCP Server README](../README.md)
