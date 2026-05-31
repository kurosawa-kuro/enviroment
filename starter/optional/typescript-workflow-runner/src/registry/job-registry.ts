/**
 * Job Registry - Workflow Step Discovery
 *
 * Central registry for all available jobs (workflow steps).
 * Provides name → implementation resolution for the workflow runner.
 *
 * ## Responsibilities
 * - Store job name → job implementation mappings
 * - Provide job lookup by name
 * - List all available workflow steps
 *
 * ## NOT Responsible For
 * - Job execution (that's the runner's job)
 * - Dependency resolution (that's the DI container's job)
 * - State management
 * - Workflow ordering
 *
 * ## Design Philosophy
 * The registry is a passive lookup table. It doesn't decide which jobs
 * to run or in what order. It simply answers: "given this name, what
 * job implementation should I use?"
 *
 * @module lib/registry
 */

import type { JobResult } from "../runner/types.js";

/**
 * Job metadata - workflow step registration info
 */
export interface JobMetadata {
  /** Unique job name - identifies this workflow step */
  name: string;
  /** Human-readable description of what this step does */
  description: string;
  /** The job handler function (executes the workflow step) */
  handler: () => Promise<JobResult>;
  /** Recommended cron schedule (informational only) */
  schedule?: string;
  /** Maximum execution time in milliseconds */
  timeout?: number;
}

/**
 * Job registry - stores all registered jobs
 */
const registry = new Map<string, JobMetadata>();

/**
 * Register a job (workflow step) with the registry
 *
 * Jobs must be registered to be discoverable by the workflow runner.
 * Registration happens automatically when job files are imported.
 *
 * @param metadata - Job metadata including name, description, and handler
 * @throws {Error} If a job with the same name is already registered
 *
 * @example
 * ```typescript
 * // Typically called at the end of each job file:
 * registerJob(myJob);
 * ```
 */
export function registerJob(metadata: JobMetadata): void {
  if (registry.has(metadata.name)) {
    throw new Error(`Job "${metadata.name}" is already registered`);
  }
  registry.set(metadata.name, metadata);
}

/**
 * Get a job by name
 *
 * @param name - Job name to look up
 * @returns Job metadata or undefined if not found
 */
export function getJob(name: string): JobMetadata | undefined {
  return registry.get(name);
}

/**
 * Get all registered jobs
 *
 * @returns Array of all registered job metadata
 */
export function getAllJobs(): JobMetadata[] {
  return Array.from(registry.values());
}

/**
 * Get all registered job names
 *
 * @returns Array of job names
 */
export function getJobNames(): string[] {
  return Array.from(registry.keys());
}

/**
 * Check if a job is registered
 *
 * @param name - Job name to check
 * @returns true if job is registered
 */
export function hasJob(name: string): boolean {
  return registry.has(name);
}

/**
 * Clear all registered jobs (useful for testing)
 */
export function clearRegistry(): void {
  registry.clear();
}

/**
 * Get job registry size
 *
 * @returns Number of registered jobs
 */
export function getRegistrySize(): number {
  return registry.size;
}
