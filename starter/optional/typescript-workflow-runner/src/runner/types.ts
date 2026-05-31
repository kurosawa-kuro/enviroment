/**
 * Common Types for Workflow Steps (Jobs)
 *
 * Core type definitions used throughout the workflow-runner system.
 * These types define the contract between jobs and the runner.
 *
 * ## Key Types
 * - JobResult: What a workflow step returns after execution
 * - JobContext: Information passed to a workflow step during execution
 * - JobFunction: Signature of a workflow step's main function
 *
 * @module lib/types
 */

/**
 * Workflow step result - what a job returns after execution
 *
 * Every job (workflow step) must return this structure.
 * The runner uses this to determine workflow success/failure.
 *
 * @example
 * ```typescript
 * return {
 *   success: true,
 *   message: "Processed 100 records",
 *   metrics: { recordsProcessed: 100 },
 * };
 * ```
 */
export interface JobResult {
  /** Whether the workflow step succeeded */
  success: boolean;
  /** Human-readable result message */
  message: string;
  /** When the step was executed (auto-filled by factory) */
  executedAt: Date;
  /** Execution time in milliseconds (auto-filled by factory) */
  duration: number;
  /** Numeric metrics for monitoring */
  metrics?: Record<string, number>;
  /** Additional structured details */
  details?: Record<string, unknown>;
}

/**
 * Job function signature
 * A function that returns a Promise resolving to a JobResult
 */
export type JobFunction = () => Promise<JobResult>;

/**
 * Job context passed to job executors
 * Contains information about the current execution
 */
export interface JobContext {
  /** Name of the job being executed */
  jobName: string;
  /** Unique identifier for this execution (for tracing) */
  executionId?: string;
  /** Unix timestamp when the job started */
  startTime: number;
}
