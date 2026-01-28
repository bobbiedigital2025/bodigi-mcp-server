#!/usr/bin/env node

/**
 * CLI script to manage OAuth clients for BoDiGi MCP Server
 * 
 * Usage:
 *   npm run create-oauth-client create --scopes tools:read,tools:call,jobs:run
 *   npm run create-oauth-client list
 *   npm run create-oauth-client delete --client-id <client_id>
 */

import { getDatabase } from '../src/db/database.js';
import { OAuthService } from '../src/auth/oauth.js';

const VALID_SCOPES = ['tools:read', 'tools:call', 'jobs:run'];

function printUsage() {
  console.log(`
BoDiGi MCP Server - OAuth Client Management

Usage:
  node dist/scripts/create-oauth-client.js <command> [options]

Commands:
  create              Create a new OAuth client
    --scopes          Comma-separated list of scopes (tools:read,tools:call,jobs:run)
    --client-id       Optional: Custom client ID (auto-generated if not provided)
    
  list                List all OAuth clients
  
  delete              Delete an OAuth client
    --client-id       Client ID to delete

Examples:
  node dist/scripts/create-oauth-client.js create --scopes tools:read,tools:call,jobs:run
  node dist/scripts/create-oauth-client.js list
  node dist/scripts/create-oauth-client.js delete --client-id client_123456
`);
}

function parseArgs(): { command: string; options: Record<string, string> } {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    return { command: '', options: {} };
  }

  const command = args[0];
  const options: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1] || '';
      options[key] = value;
      i++; // Skip the value
    }
  }

  return { command, options };
}

async function createClient(options: Record<string, string>) {
  try {
    // Parse scopes
    const scopesStr = options.scopes || '';
    if (!scopesStr) {
      console.error('❌ Error: --scopes is required');
      console.log('   Valid scopes: tools:read, tools:call, jobs:run');
      process.exit(1);
    }

    const scopes = scopesStr.split(',').map(s => s.trim());
    
    // Validate scopes
    const invalidScopes = scopes.filter(s => !VALID_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
      console.error(`❌ Error: Invalid scopes: ${invalidScopes.join(', ')}`);
      console.log(`   Valid scopes: ${VALID_SCOPES.join(', ')}`);
      process.exit(1);
    }

    // Generate or use provided client ID
    const clientId = options['client-id'] || OAuthService.generateClientId();
    
    // Generate client secret
    const clientSecret = OAuthService.generateClientSecret();
    
    // Hash the secret
    const clientSecretHash = await OAuthService.hashSecret(clientSecret);

    // Store in database
    const db = getDatabase();
    const client = db.createClient(clientId, clientSecretHash, scopes);

    console.log('\n✅ OAuth client created successfully!\n');
    console.log('Client ID:     ', clientId);
    console.log('Client Secret: ', clientSecret);
    console.log('Scopes:        ', scopes.join(', '));
    console.log('\n⚠️  IMPORTANT: Save the client secret now! It cannot be retrieved later.\n');
    console.log('To get an access token, make a POST request to /oauth/token:');
    console.log(`
curl -X POST http://localhost:3000/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "client_id": "${clientId}",
    "client_secret": "${clientSecret}"
  }'
`);
  } catch (error) {
    console.error('❌ Error creating client:', error);
    process.exit(1);
  }
}

function listClients() {
  try {
    const db = getDatabase();
    const clients = db.listClients();

    if (clients.length === 0) {
      console.log('No OAuth clients found.');
      return;
    }

    console.log('\n📋 OAuth Clients:\n');
    console.log('Client ID'.padEnd(40), 'Scopes'.padEnd(40), 'Created At');
    console.log('-'.repeat(100));
    
    for (const client of clients) {
      console.log(
        client.client_id.padEnd(40),
        client.scopes.padEnd(40),
        client.created_at
      );
    }
    console.log();
  } catch (error) {
    console.error('❌ Error listing clients:', error);
    process.exit(1);
  }
}

function deleteClient(options: Record<string, string>) {
  try {
    const clientId = options['client-id'];
    
    if (!clientId) {
      console.error('❌ Error: --client-id is required');
      process.exit(1);
    }

    const db = getDatabase();
    const deleted = db.deleteClient(clientId);

    if (deleted) {
      console.log(`✅ Client ${clientId} deleted successfully`);
    } else {
      console.log(`⚠️  Client ${clientId} not found`);
    }
  } catch (error) {
    console.error('❌ Error deleting client:', error);
    process.exit(1);
  }
}

// Main
const { command, options } = parseArgs();

switch (command) {
  case 'create':
    createClient(options);
    break;
  
  case 'list':
    listClients();
    break;
  
  case 'delete':
    deleteClient(options);
    break;
  
  default:
    printUsage();
    if (command) {
      console.error(`\n❌ Unknown command: ${command}`);
      process.exit(1);
    }
    break;
}
