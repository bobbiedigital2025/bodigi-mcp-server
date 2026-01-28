#!/usr/bin/env node

/**
 * Example: Using OAuth2 Client Credentials to access the BoDiGi MCP Server
 * 
 * This example demonstrates:
 * 1. Creating an OAuth client
 * 2. Getting an access token
 * 3. Using the token to access protected endpoints
 * 4. Handling token expiration
 */

import { getDatabase } from '../db/database.js';
import { OAuthService } from '../auth/oauth.js';

async function exampleOAuthFlow() {
  console.log('🔐 OAuth2 Client Credentials Example\n');
  
  // Step 1: Create an OAuth client (normally done by admin)
  console.log('Step 1: Creating OAuth client...');
  const clientId = OAuthService.generateClientId();
  const clientSecret = OAuthService.generateClientSecret();
  const clientSecretHash = await OAuthService.hashSecret(clientSecret);
  const scopes = ['tools:read', 'tools:call'];
  
  const db = getDatabase();
  db.createClient(clientId, clientSecretHash, scopes);
  
  console.log('✅ Client created:');
  console.log('   Client ID:', clientId);
  console.log('   Client Secret:', clientSecret);
  console.log('   Scopes:', scopes.join(', '));
  console.log();
  
  // Step 2: Authenticate and get access token
  console.log('Step 2: Getting access token...');
  const oauthService = new OAuthService();
  const tokenResponse = await oauthService.authenticateClient(clientId, clientSecret);
  
  if (!tokenResponse) {
    console.error('❌ Failed to get access token');
    return;
  }
  
  console.log('✅ Access token received:');
  console.log('   Token:', tokenResponse.access_token.substring(0, 50) + '...');
  console.log('   Type:', tokenResponse.token_type);
  console.log('   Expires in:', tokenResponse.expires_in, 'seconds');
  console.log('   Scopes:', tokenResponse.scopes.join(', '));
  console.log();
  
  // Step 3: Verify the token
  console.log('Step 3: Verifying token...');
  const payload = oauthService.verifyToken(tokenResponse.access_token);
  
  if (!payload) {
    console.error('❌ Token verification failed');
    return;
  }
  
  console.log('✅ Token verified:');
  console.log('   Client ID:', payload.client_id);
  console.log('   Scopes:', payload.scopes.join(', '));
  console.log('   Issued at:', new Date(payload.iat * 1000).toISOString());
  console.log('   Expires at:', new Date(payload.exp * 1000).toISOString());
  console.log();
  
  // Step 4: Check scopes
  console.log('Step 4: Checking scopes...');
  console.log('   Has tools:read?', oauthService.hasScope(payload, 'tools:read') ? '✅' : '❌');
  console.log('   Has tools:call?', oauthService.hasScope(payload, 'tools:call') ? '✅' : '❌');
  console.log('   Has jobs:run?', oauthService.hasScope(payload, 'jobs:run') ? '✅' : '❌');
  console.log();
  
  // Step 5: Using the token with HTTP API
  console.log('Step 5: Example HTTP API usage:');
  console.log(`
  # List available tools
  curl -X GET http://localhost:3000/list-tools \\
    -H "Authorization: Bearer ${tokenResponse.access_token}"
  
  # Call a tool
  curl -X POST http://localhost:3000/call-tool \\
    -H "Authorization: Bearer ${tokenResponse.access_token}" \\
    -H "Content-Type: application/json" \\
    -d '{
      "name": "tool_discovery",
      "arguments": {
        "category": "learning"
      }
    }'
  `);
  
  // Cleanup
  console.log('Cleaning up example client...');
  db.deleteClient(clientId);
  console.log('✅ Done!\n');
}

// Run the example
exampleOAuthFlow().catch(console.error);
