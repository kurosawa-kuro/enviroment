/**
 * Logger configuration and factory
 * @module lib/logger
 */

import pino, { type Logger } from "pino";

/** Check if running in development mode */
const isDev = process.env.NODE_ENV !== "production";

/**
 * Base pino logger instance
 * - Development: Uses pino-pretty for formatted, colorized output
 * - Production: Outputs JSON for log aggregation systems
 */
const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

/**
 * Logger context options
 */
export interface LoggerContext {
  /** Job name for identification */
  job: string;
  /** Optional execution ID for tracing specific runs */
  executionId?: string;
}

/**
 * Create a logger with job context
 * Creates a child logger that automatically includes job metadata in all log entries.
 * Useful for Lambda, cron, and parallel execution identification.
 *
 * @param context - Logger context including job name and optional execution ID
 * @returns A pino Logger instance with context bound
 *
 * @example
 * ```typescript
 * const logger = createLogger({ job: 'hello-world' });
 * logger.info('Job started');
 * // Output: { job: "hello-world", msg: "Job started", ... }
 *
 * const tracedLogger = createLogger({ job: 'my-job', executionId: 'exec_123' });
 * tracedLogger.info('Processing');
 * // Output: { job: "my-job", executionId: "exec_123", msg: "Processing", ... }
 * ```
 */
export function createLogger(context: LoggerContext): Logger {
  return baseLogger.child({
    job: context.job,
    ...(context.executionId && { executionId: context.executionId }),
  });
}

/**
 * Get the base logger instance
 * Use this only when you need a logger without job context (e.g., in index.ts)
 *
 * @returns The base pino logger
 */
export function getBaseLogger(): typeof baseLogger {
  return baseLogger;
}

/**
 * Default logger for backward compatibility
 * @deprecated Use createLogger() for new code to ensure proper job context
 */
export const logger = baseLogger;
export default logger;
