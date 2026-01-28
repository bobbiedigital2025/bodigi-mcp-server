import pino from 'pino';
import { getConfig } from '../config/index.js';

/**
 * Structured logging using Pino
 */

let logger: pino.Logger | null = null;

export function initLogger(): pino.Logger {
  if (logger) {
    return logger;
  }

  const config = getConfig();

  logger = pino({
    level: config.LOG_LEVEL,
    transport:
      config.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  });

  return logger;
}

export function getLogger(): pino.Logger {
  if (!logger) {
    return initLogger();
  }
  return logger;
}
