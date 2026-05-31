/**
 * Job Factory - Creates Workflow Steps
 *
 * Factory functions for creating standardized jobs (workflow steps).
 * Jobs created by this factory are the building blocks of workflows.
 *
 * ## What is a Job?
 * A job is a **workflow step** - a single unit of work that:
 * - Takes input (via context and dependencies)
 * - Performs processing
 * - Returns a result (success/failure with message)
 *
 * ## Responsibilities
 * - Create job instances from configuration
 * - Wire up dependency injection
 * - Automate timing, logging, and error handling
 *
 * ## NOT Responsible For
 * - Workflow orchestration (that's the runner's job)
 * - Retry/skip decisions
 * - Job scheduling
 *
 * ## Design Philosophy
 * Jobs are stateless workflow steps. They don't know about other jobs
 * or their position in a workflow. This makes them reusable and testable.
 *
 * @module application/job-factory
 */

import type { Logger } from "pino";
import type { AwilixContainer } from "awilix";
import { createLogger } from "../infra/logger/pino.js";
import type { JobResult, JobContext } from "../runner/types.js";
import {
  container as defaultContainer,
  type Dependencies,
} from "../di/index.js";

/**
 * Job executor function type (without DI)
 * Receives job context and returns partial result (without executedAt and duration)
 */
export type JobExecutor = (
  ctx: JobContext,
  logger: Logger
) => Promise<Omit<JobResult, "executedAt" | "duration">>;

/**
 * Job executor function type with DI
 * Receives job context, logger, and dependencies
 */
export type JobExecutorWithDeps = (
  ctx: JobContext,
  logger: Logger,
  deps: Dependencies
) => Promise<Omit<JobResult, "executedAt" | "duration">>;

/**
 * Options for creating a job (workflow step)
 */
export interface CreateJobOptions {
  /** Unique job name - identifies this workflow step */
  name: string;
  /** Human-readable description of what this step does */
  description?: string;
  /** Recommended cron schedule (informational only - not enforced) */
  schedule?: string;
  /** Maximum execution time in milliseconds */
  timeout?: number;
}

/**
 * Job definition - a configured workflow step ready for execution
 *
 * This is what the factory returns. The handler can be invoked by the
 * workflow runner to execute this step.
 */
export interface JobDefinition {
  /** Unique identifier for this workflow step */
  name: string;
  /** Human-readable description */
  description: string;
  /** Recommended cron schedule (informational) */
  schedule?: string;
  /** Maximum execution time in milliseconds */
  timeout?: number;
  /** Execute this workflow step (optionally with custom DI container) */
  handler: (container?: AwilixContainer<Dependencies>) => Promise<JobResult>;
}

/**
 * Create a standardized job with automatic timing, logging, and error handling
 *
 * This factory function reduces boilerplate by automatically handling:
 * - Execution timing and duration calculation
 * - Logger creation with job context
 * - Error catching and standardized error responses
 * - Execution ID generation for tracing
 *
 * @param options - Job configuration options
 * @param executor - The actual job logic to execute
 * @returns A job function that can be called or registered
 *
 * @example
 * ```typescript
 * const myJob = createJob(
 *   { name: "my-job", description: "Does something useful" },
 *   async (ctx, logger) => {
 *     logger.info("Starting work...");
 *     // ... do work ...
 *     return {
 *       success: true,
 *       message: "Work completed",
 *     };
 *   }
 * );
 *
 * // Execute the job
 * const result = await myJob.handler();
 * ```
 */
export function createJob(
  options: CreateJobOptions,
  executor: JobExecutor
): JobDefinition {
  const { name, description = "", schedule, timeout } = options;

  const handler = async (
    containerOverride?: AwilixContainer<Dependencies>
  ): Promise<JobResult> => {
    const c = containerOverride ?? defaultContainer;
    const clock = c.resolve("clock");
    const executionIdGen = c.resolve("executionId");

    const startTime = clock.now();
    const executionId = executionIdGen.generate();
    const logger = createLogger({ job: name, executionId });

    const ctx: JobContext = {
      jobName: name,
      executionId,
      startTime,
    };

    logger.info({ executionId }, "Job started");

    try {
      const result = await executor(ctx, logger);

      const duration = clock.now() - startTime;
      logger.info({ duration: `${duration}ms` }, "Job completed");

      return {
        ...result,
        executedAt: new Date(),
        duration,
      };
    } catch (error) {
      const duration = clock.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        {
          error: errorMessage,
          duration: `${duration}ms`,
        },
        "Job failed"
      );

      return {
        success: false,
        message: errorMessage,
        executedAt: new Date(),
        duration,
      };
    }
  };

  return {
    name,
    description,
    schedule,
    timeout,
    handler,
  };
}

/**
 * Create a job with dependency injection support
 *
 * Use this when your job needs access to injectable dependencies
 * like databases, external services, or time functions.
 *
 * @param options - Job configuration options
 * @param executor - The job logic with access to dependencies
 * @returns A job function that can be called with an optional container override
 *
 * @example
 * ```typescript
 * const myJob = createJobWithDeps(
 *   { name: "my-job", description: "Uses DI" },
 *   async (ctx, logger, deps) => {
 *     const { itemRepo, clock, config } = deps;
 *     const items = itemRepo.list();
 *     logger.info({ time: clock.toISOString(), count: items.length }, "Items loaded");
 *     return { success: true, message: "Done" };
 *   }
 * );
 *
 * // Production: uses default container
 * const result = await myJob.handler();
 *
 * // Test: inject mock container
 * const testResult = await myJob.handler(testContainer);
 * ```
 */
export function createJobWithDeps(
  options: CreateJobOptions,
  executor: JobExecutorWithDeps
): JobDefinition {
  const { name, description = "", schedule, timeout } = options;

  const handler = async (
    containerOverride?: AwilixContainer<Dependencies>
  ): Promise<JobResult> => {
    const c = containerOverride ?? defaultContainer;

    // Resolve all dependencies
    const deps: Dependencies = {
      clock: c.resolve("clock"),
      executionId: c.resolve("executionId"),
      config: c.resolve("config"),
      db: c.resolve("db"),
      itemRepo: c.resolve("itemRepo"),
    };

    const startTime = deps.clock.now();
    const executionId = deps.executionId.generate();
    const logger = createLogger({ job: name, executionId });

    const ctx: JobContext = {
      jobName: name,
      executionId,
      startTime,
    };

    logger.info({ executionId }, "Job started");

    try {
      const result = await executor(ctx, logger, deps);

      const duration = deps.clock.now() - startTime;
      logger.info({ duration: `${duration}ms` }, "Job completed");

      return {
        ...result,
        executedAt: new Date(),
        duration,
      };
    } catch (error) {
      const duration = deps.clock.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        {
          error: errorMessage,
          duration: `${duration}ms`,
        },
        "Job failed"
      );

      return {
        success: false,
        message: errorMessage,
        executedAt: new Date(),
        duration,
      };
    }
  };

  return {
    name,
    description,
    schedule,
    timeout,
    handler,
  };
}
