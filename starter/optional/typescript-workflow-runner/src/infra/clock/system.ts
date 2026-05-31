/**
 * System Clock Implementation
 *
 * Provides real system time using Date API.
 * Implements Clock and ExecutionIdGenerator interfaces.
 *
 * @module infra/clock/system
 */

import type { Clock, ExecutionIdGenerator } from "../../interfaces/clock.js";

/**
 * Create a system clock that uses real Date API
 */
export function createSystemClock(): Clock {
  return {
    now: () => Date.now(),
    toISOString: () => new Date().toISOString(),
  };
}

/**
 * Create an execution ID generator
 * Generates unique IDs in format: exec_{timestamp}_{random}
 */
export function createExecutionIdGenerator(): ExecutionIdGenerator {
  return {
    generate: () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `exec_${timestamp}_${random}`;
    },
  };
}
