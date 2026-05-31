/**
 * Utility functions for workflow jobs
 * @module lib/utils
 */

/**
 * Timer utility for measuring elapsed time
 *
 * @example
 * const timer = createTimer();
 * // ... do some work ...
 * console.log(timer.elapsed()); // 123
 * console.log(timer.elapsedFormatted()); // "123ms"
 */
export function createTimer() {
  const start = Date.now();

  return {
    /** Get elapsed time in milliseconds */
    elapsed: () => Date.now() - start,
    /** Get elapsed time as formatted string (e.g., "123ms") */
    elapsedFormatted: () => `${Date.now() - start}ms`,
    /** Get the start timestamp */
    startTime: start,
  };
}

/**
 * Mask sensitive information in connection strings
 * Handles various URI formats including MongoDB Atlas connection strings
 *
 * @param uri - Connection string that may contain credentials
 * @returns Masked connection string with password replaced by ****
 *
 * @example
 * maskConnectionString("mongodb+srv://user:password@cluster.mongodb.net/db")
 * // => "mongodb+srv://user:****@cluster.mongodb.net/db"
 *
 * maskConnectionString("mongodb://user:p%40ss@localhost:27017")
 * // => "mongodb://user:****@localhost:27017"
 */
export function maskConnectionString(uri: string): string {
  try {
    // Handle standard URI format: scheme://user:password@host
    // The password can contain URL-encoded special characters
    return uri.replace(
      /(:\/\/[^:]+:)([^@]+)(@)/,
      "$1****$3"
    );
  } catch {
    // If parsing fails, return a safe fallback
    return "[URI masked]";
  }
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 *
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique execution ID for job tracking
 *
 * @returns Unique execution ID string
 *
 * @example
 * generateExecutionId() // => "exec_1702900000000_abc123"
 */
export function generateExecutionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `exec_${timestamp}_${random}`;
}
