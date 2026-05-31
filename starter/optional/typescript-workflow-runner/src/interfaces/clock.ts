/**
 * Clock Port - Time operations interface
 *
 * Enables deterministic time in tests by abstracting time operations.
 *
 * @module interfaces/clock
 */

/**
 * Clock interface for time operations
 */
export interface Clock {
  /** Get current timestamp in milliseconds */
  now: () => number;
  /** Get current time as ISO string */
  toISOString: () => string;
}

/**
 * Execution ID generator interface
 * Enables predictable IDs in tests
 */
export interface ExecutionIdGenerator {
  /** Generate a unique execution ID */
  generate: () => string;
}
