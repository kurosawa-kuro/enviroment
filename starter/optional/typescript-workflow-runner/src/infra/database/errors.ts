/**
 * Database Error Handling
 *
 * Provides centralized error handling for database operations
 * with context tracking for better debugging.
 *
 * @module infra/database/errors
 */

/**
 * Database operation error
 *
 * Wraps underlying database errors with additional context
 * for better error tracking and debugging.
 */
export class DbError extends Error {
  constructor(
    message: string,
    /** Operation context (e.g., "item.create") */
    public readonly context?: string,
    /** Original error that caused this error */
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "DbError";
  }
}

/**
 * Wrap a database operation with error handling
 *
 * @param operation - The database operation to execute
 * @param context - Operation context for error messages
 * @returns The operation result
 * @throws {DbError} If the operation fails
 *
 * @example
 * ```typescript
 * const item = wrapDbOperation(() => {
 *   const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
 *   return stmt.get(id);
 * }, 'item.get');
 * ```
 */
export function wrapDbOperation<T>(operation: () => T, context?: string): T {
  try {
    return operation();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown database error";
    throw new DbError(message, context, err);
  }
}
