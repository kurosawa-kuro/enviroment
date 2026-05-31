/**
 * Logger Port - Logging interface
 *
 * Abstracts logging operations for testability.
 * Implementation can use pino, winston, or any other logger.
 *
 * @module interfaces/logger
 */

/**
 * Logger interface for structured logging
 */
export interface Logger {
  /** Log informational message */
  info: (obj: object, msg?: string) => void;
  /** Log warning message */
  warn: (obj: object, msg?: string) => void;
  /** Log error message */
  error: (obj: object, msg?: string) => void;
  /** Log debug message */
  debug: (obj: object, msg?: string) => void;
  /** Log fatal error message */
  fatal: (obj: object, msg?: string) => void;
}
