import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration module with Zod validation
 * Loads and validates environment variables
 */

const configSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // API Security
  MCP_API_KEYS: z
    .string()
    .default('')
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        : []
    ),

  // Web Fetch Security
  ALLOWED_DOMAINS: z
    .string()
    .default('wikipedia.org,github.com,.edu,.gov')
    .transform((val) =>
      val
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
    ),
  FETCH_TIMEOUT_MS: z.string().default('10000').transform(Number),
  MAX_FETCH_BYTES: z.string().default('1048576').transform(Number), // 1MB default

  // Database
  DATABASE_URL: z.string().optional(),
  SQLITE_PATH: z.string().default('./data/bodigi.db'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Cron/Scheduling
  CRON_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  CRON_SCHEDULE_DAILY_LEARN: z.string().default('0 2 * * *'), // 2 AM daily

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

/**
 * Load and validate configuration from environment
 */
export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = configSchema.parse(process.env);
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid configuration');
    }
    throw error;
  }
}

/**
 * Get current configuration (must call loadConfig first)
 */
export function getConfig(): Config {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}

/**
 * Reset cached config (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null;
}
