import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getDatabase } from '../db/database.js';

export interface TokenPayload {
  client_id: string;
  scopes: string[];
  iat: number;
  exp: number;
}

export class OAuthService {
  private jwtSecret: string;
  private tokenExpirationMinutes: number = 15;

  constructor(jwtSecret?: string) {
    // Use environment variable or default secret (in production, always use env var)
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || '';
    
    if (!this.jwtSecret) {
      // Generate a random secret if none provided (for development only)
      this.jwtSecret = crypto.randomBytes(32).toString('hex');
      console.warn('⚠️  WARNING: No JWT_SECRET provided. Generated random secret for this session.');
      console.warn('⚠️  Set JWT_SECRET environment variable in production!');
    }
  }

  /**
   * Authenticate client credentials and issue JWT token
   */
  public async authenticateClient(clientId: string, clientSecret: string): Promise<{ access_token: string; token_type: string; expires_in: number; scopes: string[] } | null> {
    const db = getDatabase();
    const client = db.getClientByClientId(clientId);

    if (!client) {
      return null;
    }

    // Verify client secret
    const isValid = await bcrypt.compare(clientSecret, client.client_secret_hash);
    if (!isValid) {
      return null;
    }

    // Parse scopes
    const scopes = client.scopes.split(',');

    // Generate JWT token
    const token = this.generateToken(clientId, scopes);
    const expiresIn = this.tokenExpirationMinutes * 60; // Convert to seconds

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scopes
    };
  }

  /**
   * Generate JWT access token
   */
  private generateToken(clientId: string, scopes: string[]): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      client_id: clientId,
      scopes
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: `${this.tokenExpirationMinutes}m`
    });
  }

  /**
   * Verify and decode JWT token
   */
  public verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token has required scope
   */
  public hasScope(token: TokenPayload, requiredScope: string): boolean {
    return token.scopes.includes(requiredScope);
  }

  /**
   * Hash a client secret for storage
   */
  public static async hashSecret(secret: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(secret, saltRounds);
  }

  /**
   * Generate a secure random client ID
   */
  public static generateClientId(): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `client_${timestamp}_${randomBytes}`;
  }

  /**
   * Generate a secure random client secret
   */
  public static generateClientSecret(): string {
    // Generate a cryptographically secure 32-byte random string
    return crypto.randomBytes(32).toString('base64url');
  }
}

// Singleton instance
let oauthServiceInstance: OAuthService | null = null;

export function getOAuthService(): OAuthService {
  if (!oauthServiceInstance) {
    oauthServiceInstance = new OAuthService();
  }
  return oauthServiceInstance;
}
