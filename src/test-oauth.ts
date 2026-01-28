/**
 * OAuth2 Client Credentials Integration Test
 * Tests the complete OAuth flow including client creation, token generation, and protected endpoints
 */

import { spawn, ChildProcess } from 'child_process';
import { resolve as resolvePath } from 'path';
import { getDatabase } from '../src/db/database.js';
import { OAuthService } from '../src/auth/oauth.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
const API_BASE = 'http://localhost:3000';
let serverProcess: ChildProcess | null = null;

// Helper function to make HTTP requests
async function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; data: any }> {
  const url = `${API_BASE}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    throw new Error(`Request failed: ${error}`);
  }
}

// Test 1: Health check (no auth)
async function testHealthCheck(): Promise<void> {
  const testName = 'Health check endpoint';
  try {
    const { status, data } = await makeRequest('GET', '/health');
    
    if (status === 200 && data.status === 'ok') {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
    } else {
      results.push({ name: testName, passed: false, error: `Unexpected response: ${JSON.stringify(data)}` });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Test 2: Create OAuth client programmatically
async function testCreateOAuthClient(): Promise<{ clientId: string; clientSecret: string } | null> {
  const testName = 'Create OAuth client';
  try {
    const clientId = OAuthService.generateClientId();
    const clientSecret = OAuthService.generateClientSecret();
    const clientSecretHash = await OAuthService.hashSecret(clientSecret);
    const scopes = ['tools:read', 'tools:call', 'jobs:run'];

    const db = getDatabase();
    db.createClient(clientId, clientSecretHash, scopes);

    results.push({ name: testName, passed: true });
    console.log('✅', testName);
    console.log('   Client ID:', clientId);
    
    return { clientId, clientSecret };
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
    return null;
  }
}

// Test 3: Get OAuth token with valid credentials
async function testGetToken(clientId: string, clientSecret: string): Promise<string | null> {
  const testName = 'Get OAuth token with valid credentials';
  try {
    const { status, data } = await makeRequest('POST', '/oauth/token', {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });

    if (status === 200 && data.access_token && data.token_type === 'Bearer') {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
      console.log('   Token received, expires in:', data.expires_in, 'seconds');
      return data.access_token;
    } else {
      results.push({ name: testName, passed: false, error: `Unexpected response: ${JSON.stringify(data)}` });
      console.log('❌', testName);
      return null;
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
    return null;
  }
}

// Test 4: Get token with invalid credentials
async function testInvalidCredentials(): Promise<void> {
  const testName = 'Reject invalid credentials';
  try {
    const { status, data } = await makeRequest('POST', '/oauth/token', {
      grant_type: 'client_credentials',
      client_id: 'invalid_client',
      client_secret: 'invalid_secret'
    });

    if (status === 401 && data.error === 'invalid_client') {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
    } else {
      results.push({ name: testName, passed: false, error: 'Should return 401 for invalid credentials' });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Test 5: Access protected endpoint with valid JWT
async function testProtectedEndpointWithJWT(token: string): Promise<void> {
  const testName = 'Access protected endpoint with valid JWT';
  try {
    const { status, data } = await makeRequest('GET', '/list-tools', undefined, {
      'Authorization': `Bearer ${token}`
    });

    if (status === 200 && data.tools && Array.isArray(data.tools)) {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
      console.log('   Tools count:', data.tools.length);
    } else {
      results.push({ name: testName, passed: false, error: `Unexpected response: ${JSON.stringify(data)}` });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Test 6: Access protected endpoint with API key (backward compatibility)
async function testProtectedEndpointWithAPIKey(): Promise<void> {
  const testName = 'Access protected endpoint with API key (backward compatibility)';
  try {
    const { status, data } = await makeRequest('GET', '/list-tools', undefined, {
      'Authorization': 'Bearer my-legacy-api-key-123'
    });

    if (status === 200 && data.tools && Array.isArray(data.tools)) {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
    } else {
      results.push({ name: testName, passed: false, error: `Unexpected response: ${JSON.stringify(data)}` });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Test 7: Access protected endpoint without auth
async function testProtectedEndpointWithoutAuth(): Promise<void> {
  const testName = 'Reject access without authentication';
  try {
    const { status, data } = await makeRequest('GET', '/list-tools');

    if (status === 401 && data.error === 'unauthorized') {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
    } else {
      results.push({ name: testName, passed: false, error: 'Should return 401 without auth' });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Test 8: Call tool with JWT token
async function testCallToolWithJWT(token: string): Promise<void> {
  const testName = 'Call tool with valid JWT token';
  try {
    const { status, data } = await makeRequest('POST', '/call-tool', {
      name: 'tool_discovery',
      arguments: { category: 'learning' }
    }, {
      'Authorization': `Bearer ${token}`
    });

    if (status === 200 && data.result) {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
    } else {
      results.push({ name: testName, passed: false, error: `Unexpected response: ${JSON.stringify(data)}` });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Test 9: Test scope enforcement
async function testScopeEnforcement(): Promise<void> {
  const testName = 'Enforce scope requirements';
  try {
    // Create a client with limited scopes (only tools:read)
    const clientId = OAuthService.generateClientId();
    const clientSecret = OAuthService.generateClientSecret();
    const clientSecretHash = await OAuthService.hashSecret(clientSecret);
    
    const db = getDatabase();
    db.createClient(clientId, clientSecretHash, ['tools:read']); // Only read permission

    // Get token
    const { data: tokenData } = await makeRequest('POST', '/oauth/token', {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });

    const token = tokenData.access_token;

    // Try to call tool (requires tools:call scope) - should fail
    const { status, data } = await makeRequest('POST', '/call-tool', {
      name: 'tool_discovery',
      arguments: { category: 'learning' }
    }, {
      'Authorization': `Bearer ${token}`
    });

    if (status === 403 && data.error === 'forbidden') {
      results.push({ name: testName, passed: true });
      console.log('✅', testName);
    } else {
      results.push({ name: testName, passed: false, error: 'Should return 403 for insufficient scopes' });
      console.log('❌', testName);
    }
  } catch (error) {
    results.push({ name: testName, passed: false, error: String(error) });
    console.log('❌', testName, '-', error);
  }
}

// Start HTTP server
async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = resolvePath('./dist/http-server.js');
    const proc = spawn('node', [serverPath], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '3000' }
    });
    
    serverProcess = proc;

    proc.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on port')) {
        console.log('🚀 HTTP Server started\n');
        resolve();
      }
    });

    proc.stderr?.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    proc.on('error', (error) => {
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Server failed to start within 10 seconds'));
    }, 10000);
  });
}

// Stop HTTP server
function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    console.log('\n🛑 HTTP Server stopped');
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting OAuth2 Client Credentials Integration Tests\n');

  try {
    // Start server
    await startServer();
    
    // Wait a bit for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run tests
    console.log('Running tests...\n');
    
    await testHealthCheck();
    const client = await testCreateOAuthClient();
    
    if (client) {
      const token = await testGetToken(client.clientId, client.clientSecret);
      await testInvalidCredentials();
      
      if (token) {
        await testProtectedEndpointWithJWT(token);
        await testCallToolWithJWT(token);
      }
      
      await testProtectedEndpointWithAPIKey();
      await testProtectedEndpointWithoutAuth();
      await testScopeEnforcement();
    }

    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }

    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
      stopServer();
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      stopServer();
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    stopServer();
    process.exit(1);
  }
}

runTests().catch(console.error);
