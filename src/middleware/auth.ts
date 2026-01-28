import { Request, Response, NextFunction } from 'express';
import { getOAuthService } from '../auth/oauth.js';
import { TokenPayload } from '../auth/oauth.js';

// Extend Express Request to include auth info
declare global {
  namespace Express {
    interface Request {
      auth?: {
        type: 'api-key' | 'jwt';
        token?: TokenPayload;
        apiKey?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using either API key or JWT
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing Authorization header' });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid Authorization header format. Expected: Bearer <token>' });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Try to verify as JWT first
  const oauthService = getOAuthService();
  const tokenPayload = oauthService.verifyToken(token);

  if (tokenPayload) {
    // Valid JWT token
    req.auth = {
      type: 'jwt',
      token: tokenPayload
    };
    next();
    return;
  }

  // If not a valid JWT, treat as API key
  // NOTE: For backward compatibility, any non-JWT token is accepted as an API key
  // In a production environment, you should validate API keys against a database
  // or disable API key support entirely by removing this fallback
  req.auth = {
    type: 'api-key',
    apiKey: token
  };
  next();
}

/**
 * Middleware to enforce scope-based authorization
 */
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // API keys have full access (backward compatibility)
    if (req.auth?.type === 'api-key') {
      next();
      return;
    }

    // JWT tokens must have the required scope
    if (req.auth?.type === 'jwt' && req.auth.token) {
      const oauthService = getOAuthService();
      if (oauthService.hasScope(req.auth.token, requiredScope)) {
        next();
        return;
      }
    }

    res.status(403).json({ 
      error: 'forbidden', 
      message: `Missing required scope: ${requiredScope}` 
    });
  };
}

/**
 * Optional authentication middleware - allows requests without auth
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  // If auth header exists, validate it
  authenticate(req, res, next);
}
