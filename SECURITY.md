# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

### SSRF Protection

The BoDiGi MCP Server implements comprehensive Server-Side Request Forgery (SSRF) protection:

#### Blocked IP Ranges
- `127.0.0.0/8` - Loopback addresses
- `10.0.0.0/8` - Private network
- `172.16.0.0/12` - Private network
- `192.168.0.0/16` - Private network
- `169.254.0.0/16` - Link-local addresses
- `0.0.0.0/8` - Reserved
- `224.0.0.0/4` - Multicast
- `240.0.0.0/4` - Reserved
- `::1` - IPv6 loopback
- `fe80::/10` - IPv6 link-local
- `fc00::/7` - IPv6 unique local

#### Blocked Hostnames
- `localhost`
- `metadata.google.internal`
- `169.254.169.254` (AWS/GCP metadata)
- `100.100.100.200` (Alibaba metadata)

#### Domain Allowlist
Only domains explicitly listed in `ALLOWED_DOMAINS` environment variable can be fetched.

**Default allowed domains:**
- `wikipedia.org`
- `github.com`
- `.edu` domains
- `.gov` domains

### Authentication

#### API Keys
- All protected endpoints require `Authorization: Bearer <key>` header
- Keys are configured via `MCP_API_KEYS` environment variable
- Multiple keys supported (comma-separated)
- Keys should be at least 32 characters (use `crypto.randomBytes(32).toString('hex')`)

**Example:**
```bash
# Generate a secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Public Endpoints
Only `/health` endpoint is public. All other endpoints require authentication.

### Rate Limiting

Default limits (configurable):
- Window: 60 seconds
- Max requests: 100 per window
- Response: 429 Too Many Requests

### Audit Logging

All tool executions are logged to the database with:
- API key hint (first 4 characters)
- Tool name
- Parameters (JSON)
- Timestamp
- Status (success/error)
- Error details (if applicable)

### Content Security

#### Fetch Limits
- Timeout: 10 seconds (configurable)
- Max size: 1MB (configurable)
- Protocol: HTTP/HTTPS only

#### Input Validation
- All tool parameters validated with Zod schemas
- Malformed requests rejected with 400 Bad Request
- Detailed error messages for debugging

### Database Security

#### SQLite
- Database stored in configurable location
- WAL mode enabled for concurrent access
- Prepared statements prevent SQL injection

#### PostgreSQL (Optional)
- Connection via `DATABASE_URL`
- SSL recommended for production
- Use strong credentials

### Docker Security

- Runs as non-root user (`node`)
- Minimal Alpine base image
- Multi-stage build (no dev dependencies in final image)
- Health checks configured

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
1. GitHub Security Advisories (preferred)
2. Email to security@bodigi.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 1-3 days
  - High: 7-14 days
  - Medium: 30 days
  - Low: 90 days

## Security Best Practices

### For Deployment

1. **Always set strong API keys**
   ```bash
   # DON'T use weak keys
   MCP_API_KEYS=test123,dev456
   
   # DO use strong random keys
   MCP_API_KEYS=a7f8d9e6c5b4a3210fedcba9876543210fedcba9876543210fedcba98765432
   ```

2. **Restrict allowed domains**
   ```bash
   # DON'T allow all domains
   ALLOWED_DOMAINS=*
   
   # DO specify exact domains needed
   ALLOWED_DOMAINS=wikipedia.org,github.com,docs.python.org
   ```

3. **Use environment variables, never commit secrets**
   ```bash
   # Add to .gitignore (already done)
   .env
   .env.*
   !.env.example
   ```

4. **Enable HTTPS in production**
   - Use a reverse proxy (nginx, Caddy)
   - Use Render/Heroku built-in SSL
   - Never expose HTTP directly

5. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

6. **Monitor audit logs**
   ```sql
   -- Check for suspicious activity
   SELECT * FROM tool_audit 
   WHERE status = 'error' 
   ORDER BY created_at DESC 
   LIMIT 100;
   ```

### For Development

1. **Never commit `.env` files**
2. **Use `.env.example` for documentation**
3. **Run security checks before deployment**
4. **Test SSRF protection with known bad IPs**
5. **Validate all user input**

## Security Checklist

Before deploying to production:

- [ ] Strong API keys configured (32+ chars)
- [ ] `.env` file not committed to git
- [ ] Allowed domains list reviewed and minimal
- [ ] Rate limiting configured appropriately
- [ ] HTTPS enabled
- [ ] Database credentials secure
- [ ] Logs reviewed for sensitive data
- [ ] Dependencies up to date (`npm audit`)
- [ ] Docker image scanned (if using Docker)
- [ ] Backup strategy in place

## Known Security Considerations

### Current Limitations

1. **API Key Storage**
   - Keys stored in plain text in environment
   - Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production

2. **Database Encryption**
   - SQLite database not encrypted at rest
   - Use encrypted volumes or PostgreSQL with encryption for sensitive data

3. **DOS Protection**
   - Rate limiting provides basic protection
   - Consider using a WAF (Cloudflare, AWS WAF) for production

### Future Enhancements

- OAuth 2.0 support
- JWT tokens
- Database encryption at rest
- Enhanced DOS protection
- Web Application Firewall integration

## Compliance

### Data Handling
- All fetched content is stored with hash for deduplication
- Personal data should not be stored without consent
- Audit logs contain API key hints, not full keys

### GDPR Considerations
- If storing EU user data, ensure compliance
- Provide data deletion capabilities
- Maintain audit trail of data access

## Contact

For security concerns:
- GitHub Security Advisories
- Email: security@bodigi.com

For general questions:
- GitHub Issues
- Documentation: README.md
