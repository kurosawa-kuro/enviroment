/**
 * Workflow Runner - Job Execution Engine
 *
 * Provides utilities for executing jobs (workflow steps) in a controlled manner.
 * This module is the core of the workflow-runner architecture.
 *
 * ## Responsibilities
 * - Execute jobs in defined order
 * - Control success/failure flow
 * - Handle process exit codes
 *
 * ## NOT Responsible For
 * - Parallel execution
 * - Retry logic
 * - Skip logic
 * - Interactive prompts
 * - Job scheduling (cron handles this externally)
 *
 * ## Design Philosophy
 * Jobs are workflow steps. They are executed sequentially by this runner.
 * The runner does not make decisions about which jobs to run - that is
 * determined by the workflow definition (index.ts or external orchestrator).
 *
 * @module lib/runner
 */

import { fileURLToPath } from "url";
import { argv } from "process";
import type { JobResult, JobFunction } from "./types.js";
import logger from "../infra/logger/pino.js";
import { EXIT_CODES } from "../shared/constants.js";

/**
 * Check if current module is the main entry point (ESM version)
 * Equivalent to `require.main === module` in CommonJS
 *
 * This is useful for files that can be both imported as a module
 * and executed directly as a CLI script.
 *
 * @param importMetaUrl - Pass `import.meta.url` from the calling module
 * @returns true if the module is being run directly, false if imported
 *
 * @example
 * ```typescript
 * if (isMainModule(import.meta.url)) {
 *   console.log("Running as CLI");
 * } else {
 *   console.log("Imported as module");
 * }
 * ```
 */
export function isMainModule(importMetaUrl: string): boolean {
  const modulePath = fileURLToPath(importMetaUrl);
  const entryPoint = argv[1];
  return modulePath === entryPoint;
}

/**
 * Execute a job (workflow step) with proper exit handling
 *
 * This is the primary entry point for running a job as a workflow step.
 * Only calls process.exit() when running as main module (not when imported).
 *
 * ## Workflow Context
 * Jobs are workflow steps. When executed directly (via npm script or node),
 * this function handles the process lifecycle. When imported (Lambda, tests),
 * it returns without calling process.exit().
 *
 * ## Exit Codes
 * - 0: Job succeeded (result.success === true)
 * - 1: Job failed (result.success === false or uncaught error)
 *
 * @param job - The job function (workflow step) to execute
 * @param importMetaUrl - Pass `import.meta.url` from the calling module
 *
 * @example
 * ```typescript
 * // At the end of your job file:
 * export const main = myJob.handler;
 * runIfMain(main, import.meta.url);
 * ```
 */
export function runIfMain(job: JobFunction, importMetaUrl: string): void {
  if (!isMainModule(importMetaUrl)) {
    return;
  }

  job()
    .then((result: JobResult) => {
      process.exit(result.success ? EXIT_CODES.SUCCESS : EXIT_CODES.FAILURE);
    })
    .catch((error: unknown) => {
      logger.fatal({ error }, "Unexpected error");
      process.exit(EXIT_CODES.FAILURE);
    });
}
