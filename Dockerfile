# Production-ready Dockerfile for BoDiGi MCP Server
# Using Debian-based image for better package availability and reliability
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules (better-sqlite3)
RUN apt-get update && \
    apt-get install -y \
        python3 \
        make \
        g++ \
        --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code BEFORE npm install (needed for prepare script)
COPY src/ ./src/

# Install dependencies (this will also run the prepare script which builds)
RUN npm install --production=false

# Remove dev dependencies
RUN npm prune --production

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start HTTP server by default (can override for MCP stdio)
CMD ["node", "dist/http-server.js"]
