/**
 * Application constants
 * @module lib/constants
 */

/**
 * Timeout values in milliseconds
 */
export const TIMEOUTS = {
  /** MongoDB server selection timeout */
  MONGODB_SERVER_SELECTION: 10_000,
  /** MongoDB connection timeout */
  MONGODB_CONNECT: 10_000,
  /** Default job timeout */
  DEFAULT_JOB: 300_000, // 5 minutes
} as const;

/**
 * Exit codes for CLI
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  FAILURE: 1,
  CONFIGURATION_ERROR: 2,
} as const;

/**
 * Log levels supported by pino
 */
export const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Node environment values
 */
export const NODE_ENVS = ["development", "production", "test"] as const;

export type NodeEnv = (typeof NODE_ENVS)[number];
