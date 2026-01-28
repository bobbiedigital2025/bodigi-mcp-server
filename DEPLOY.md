# Deployment Guide

## Table of Contents
- [Deploy to Render](#deploy-to-render)
- [Deploy with Docker](#deploy-with-docker)
- [Deploy to Other Platforms](#deploy-to-other-platforms)
- [Post-Deployment](#post-deployment)

## Deploy to Render

Render is the recommended platform for deploying BoDiGi MCP Server. It provides:
- Free tier available
- Automatic HTTPS
- Persistent disk storage
- Easy environment variable management
- Auto-deploy from GitHub

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Your repository pushed to GitHub

### Step-by-Step Instructions

#### 1. Create a New Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your `bodigi-mcp-server` repository

#### 2. Configure the Service

**Basic Settings:**
- **Name:** `bodigi-mcp-server` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your production branch)
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** 
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm run start:http
  ```

**Instance Type:**
- **Free Tier:** Good for testing
- **Starter ($7/month):** Recommended for production
- **Standard:** For high traffic

#### 3. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

**Required Variables:**

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `MCP_API_KEYS` | Your secure API keys | `a7f8d9e6c5b4a321...` |
| `ALLOWED_DOMAINS` | Comma-separated domains | `wikipedia.org,github.com,.edu` |

**Optional Variables:**

| Key | Value | Default |
|-----|-------|---------|
| `LOG_LEVEL` | `info` or `debug` | `info` |
| `FETCH_TIMEOUT_MS` | `10000` | `10000` |
| `MAX_FETCH_BYTES` | `1048576` | `1048576` |
| `CRON_ENABLED` | `true` or `false` | `false` |
| `CRON_SCHEDULE_DAILY_LEARN` | Cron expression | `0 2 * * *` |
| `RATE_LIMIT_WINDOW_MS` | `60000` | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | `100` |

**To generate secure API keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Add Persistent Disk

For the SQLite database to persist across deploys:

1. Scroll to **"Disk"** section
2. Click **"Add Disk"**
3. Configure:
   - **Name:** `bodigi-data`
   - **Mount Path:** `/app/data`
   - **Size:** `1 GB` (increase as needed)

**Important:** Also add this environment variable:
```
SQLITE_PATH=/app/data/bodigi.db
```

#### 5. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run the build command
   - Start your server
   - Provide a URL: `https://your-service.onrender.com`

#### 6. Verify Deployment

Test the health endpoint:
```bash
curl https://your-service.onrender.com/health
```

Expected response:
```json
{
  "ok": true,
  "service": "bodigi-mcp-server",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Render-Specific Configuration

#### Auto-Deploy
By default, Render auto-deploys on every push to your branch. To disable:
1. Go to **Settings**
2. Uncheck **"Auto-Deploy"**

#### Custom Domain
1. Go to **Settings** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Follow DNS configuration instructions

#### Logs
View logs in real-time:
1. Go to your service
2. Click **"Logs"** tab
3. Filter by log level if needed

#### Metrics
Monitor your service:
1. Click **"Metrics"** tab
2. View CPU, Memory, and Request metrics

### Render Gotchas

1. **Free tier sleeps after 15 min inactivity**
   - First request after sleep takes ~30 seconds
   - Upgrade to Starter for 24/7 uptime

2. **Environment changes require manual deploy**
   - After changing env vars, click **"Manual Deploy"** → **"Deploy latest commit"**

3. **Disk size cannot be reduced**
   - Start small and increase as needed

4. **Port is auto-assigned**
   - Don't set `PORT` env var
   - Server automatically uses Render's `PORT`

## Deploy with Docker

### Local Docker Deployment

```bash
# Build the image
docker build -t bodigi-mcp-server .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_API_KEYS=your-key-here \
  -e ALLOWED_DOMAINS=wikipedia.org,github.com \
  -v $(pwd)/data:/app/data \
  --name bodigi-mcp \
  bodigi-mcp-server

# Check logs
docker logs bodigi-mcp

# Check health
curl http://localhost:3000/health
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bodigi-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_API_KEYS=${MCP_API_KEYS}
      - ALLOWED_DOMAINS=${ALLOWED_DOMAINS}
      - CRON_ENABLED=true
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Create `.env` file:
```bash
MCP_API_KEYS=your-key-here
ALLOWED_DOMAINS=wikipedia.org,github.com,.edu
```

Run:
```bash
docker-compose up -d
```

### Deploy to Container Registry

#### Docker Hub
```bash
docker tag bodigi-mcp-server:latest username/bodigi-mcp-server:latest
docker push username/bodigi-mcp-server:latest
```

#### GitHub Container Registry
```bash
docker tag bodigi-mcp-server:latest ghcr.io/username/bodigi-mcp-server:latest
docker push ghcr.io/username/bodigi-mcp-server:latest
```

## Deploy to Other Platforms

### Heroku

1. Create `Procfile`:
```
web: npm run start:http
```

2. Deploy:
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MCP_API_KEYS=your-key
heroku config:set ALLOWED_DOMAINS=wikipedia.org,github.com
git push heroku main
```

### Railway

1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### DigitalOcean App Platform

1. Create new app from GitHub
2. Build command: `npm install && npm run build`
3. Run command: `npm run start:http`
4. Add environment variables
5. Add database (PostgreSQL recommended)

### AWS ECS/Fargate

1. Build and push Docker image to ECR
2. Create ECS cluster
3. Create task definition with image
4. Create service
5. Configure load balancer
6. Add environment variables via task definition

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/bodigi-mcp-server

# Deploy
gcloud run deploy bodigi-mcp-server \
  --image gcr.io/PROJECT_ID/bodigi-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MCP_API_KEYS=your-key,ALLOWED_DOMAINS=wikipedia.org
```

### VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/username/bodigi-mcp-server.git
cd bodigi-mcp-server

# Install dependencies
npm install

# Create .env file
nano .env

# Build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start server
pm2 start dist/http-server.js --name bodigi-mcp

# Save PM2 config
pm2 save
pm2 startup
```

## Post-Deployment

### 1. Test All Endpoints

```bash
# Health check (public)
curl https://your-domain.com/health

# List tools (requires auth)
curl -H "Authorization: Bearer YOUR_KEY" \
  https://your-domain.com/list-tools

# Call a tool
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"web_fetch","params":{"url":"https://wikipedia.org"}}' \
  https://your-domain.com/call-tool
```

### 2. Add Knowledge Sources

To enable daily learning:

```bash
# Connect to your database
sqlite3 /app/data/bodigi.db

# Add sources
INSERT INTO knowledge_sources (name, url, enabled, fetch_interval_hours)
VALUES ('Wikipedia AI', 'https://en.wikipedia.org/wiki/Artificial_intelligence', 1, 24);

INSERT INTO knowledge_sources (name, url, enabled, fetch_interval_hours)
VALUES ('GitHub Trending', 'https://github.com/trending', 1, 12);
```

### 3. Enable Scheduled Learning

Set environment variable:
```bash
CRON_ENABLED=true
CRON_SCHEDULE_DAILY_LEARN=0 2 * * *
```

### 4. Monitor Logs

Watch for errors and suspicious activity:
```bash
# Render: Use the web dashboard
# Docker: docker logs -f bodigi-mcp
# PM2: pm2 logs bodigi-mcp
```

### 5. Setup Alerts

Configure alerts for:
- Service downtime
- High error rates
- Failed authentication attempts
- Disk space usage

### 6. Backup Database

```bash
# SQLite backup
sqlite3 /app/data/bodigi.db ".backup '/backup/bodigi-$(date +%Y%m%d).db'"

# Schedule with cron
0 3 * * * sqlite3 /app/data/bodigi.db ".backup '/backup/bodigi-$(date +\%Y\%m\%d).db'"
```

## Troubleshooting

### Server won't start
1. Check logs for error messages
2. Verify environment variables are set
3. Check disk space for SQLite
4. Verify Node.js version (20+)

### Authentication fails
1. Verify `MCP_API_KEYS` is set
2. Check API key format (no spaces)
3. Verify `Authorization` header format: `Bearer <key>`

### Web fetch fails
1. Check domain is in `ALLOWED_DOMAINS`
2. Verify URL is valid
3. Check timeout settings
4. Review SSRF protection logs

### Database errors
1. Verify disk is mounted correctly
2. Check write permissions
3. Verify `SQLITE_PATH` points to mounted disk
4. Check disk space

### High memory usage
1. Monitor with metrics dashboard
2. Adjust `MAX_FETCH_BYTES` lower
3. Implement request queuing
4. Scale to larger instance

## Support

- Documentation: README.md
- Security: SECURITY.md
- Issues: GitHub Issues
- Email: support@bodigi.com
