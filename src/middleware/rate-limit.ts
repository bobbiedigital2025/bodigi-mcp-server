import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Simple in-memory rate limiter
 * For production, consider using express-rate-limit or Redis-based rate limiting
 */
export class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100
  ) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  private getKey(req: Request): string {
    // Use client_id from JWT if available, otherwise use IP
    if (req.auth?.type === 'jwt' && req.auth.token) {
      return `jwt:${req.auth.token.client_id}`;
    }
    
    // Use IP address as fallback
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const now = Date.now();

      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
        next();
        return;
      }

      const record = this.store[key];

      // Reset if window has passed
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + this.windowMs;
        next();
        return;
      }

      // Increment count
      record.count++;

      // Check if limit exceeded
      if (record.count > this.maxRequests) {
        res.status(429).json({
          error: 'too_many_requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
        return;
      }

      next();
    };
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Create rate limiter middleware with custom limits
 */
export function createRateLimiter(windowMs?: number, maxRequests?: number): (req: Request, res: Response, next: NextFunction) => void {
  const limiter = new RateLimiter(windowMs, maxRequests);
  return limiter.middleware();
}
