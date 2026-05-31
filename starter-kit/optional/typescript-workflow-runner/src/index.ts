#!/usr/bin/env node
/**
 * Runner Entry Point
 *
 * Main entry point that dispatches to the appropriate runner
 * based on configuration (runnerMode in config.yaml or RUNNER_MODE env).
 *
 * ## Supported Modes
 * - workflow: Execute all jobs in sequence (default)
 * - cli: Execute single job as CLI command (future)
 *
 * ## Usage
 * ```bash
 * npm start                      # Run workflow (all jobs)
 * npm start -- <job-name>        # Run specific job
 * RUNNER_MODE=cli npm start      # CLI mode (future)
 * ```
 *
 * @module index
 */

import { getConfig } from "./infra/config/yaml.js";
import { getBaseLogger } from "./infra/logger/pino.js";
import { getJob, getAllJobs } from "./registry/job-registry.js";
import { EXIT_CODES } from "./shared/constants.js";

// Import jobs to trigger registration
import "./application/jobs/index.js";

const logger = getBaseLogger();
const config = getConfig();

// ============================================================================
// Workflow Runner
// ============================================================================

/**
 * Display help message with available workflow steps
 */
function showHelp(): void {
  const jobs = getAllJobs();

  console.log("\nWorkflow Runner");
  console.log("===============\n");
  console.log("Usage:");
  console.log("  npm start              - Run all workflow steps in sequence");
  console.log("  npm start -- <job>     - Run a specific workflow step");
  console.log("  npm start -- --help    - Show this help message\n");
  console.log("Available workflow steps:\n");

  if (jobs.length === 0) {
    console.log("  (no jobs registered)");
  } else {
    const maxNameLength = Math.max(...jobs.map((j) => j.name.length));
    for (const job of jobs) {
      const padding = " ".repeat(maxNameLength - job.name.length);
      const schedule = job.schedule ? ` [${job.schedule}]` : "";
      console.log(`  ${job.name}${padding}  - ${job.description}${schedule}`);
    }
  }

  console.log("\nExamples:");
  console.log("  npm start                  # Run full workflow");
  console.log("  npm start -- hello-world   # Run single step");
}

/**
 * Execute a single workflow step by name
 */
async function runStep(jobName: string): Promise<boolean> {
  const job = getJob(jobName);

  if (!job) {
    const jobs = getAllJobs();
    logger.error(
      { jobName, availableJobs: jobs.map((j) => j.name) },
      "Workflow step not found"
    );
    return false;
  }

  logger.info({ job: jobName }, "Starting workflow step");
  const result = await job.handler();
  return result.success;
}

/**
 * Execute all workflow steps in sequence
 */
async function runWorkflow(): Promise<void> {
  const jobs = getAllJobs();

  if (jobs.length === 0) {
    logger.warn("No workflow steps registered");
    process.exit(EXIT_CODES.SUCCESS);
  }

  logger.info({ steps: jobs.map((j) => j.name) }, "Starting workflow");

  let hasFailure = false;

  for (const job of jobs) {
    const success = await runStep(job.name);
    if (!success) {
      hasFailure = true;
      logger.error({ job: job.name }, "Workflow step failed, continuing...");
    }
  }

  logger.info({ success: !hasFailure }, "Workflow completed");
  process.exit(hasFailure ? EXIT_CODES.FAILURE : EXIT_CODES.SUCCESS);
}

/**
 * Execute a specific workflow step by name
 */
async function runSingleJob(jobName: string): Promise<void> {
  const success = await runStep(jobName);
  process.exit(success ? EXIT_CODES.SUCCESS : EXIT_CODES.FAILURE);
}

// ============================================================================
// CLI Runner (Future)
// ============================================================================

/**
 * Execute job as CLI command
 */
async function runCli(command: string): Promise<void> {
  const job = getJob(command);

  if (!job) {
    console.error(`Unknown command: ${command}`);
    console.error("Available commands:");
    getAllJobs().forEach((j) => console.error(`  ${j.name} - ${j.description}`));
    process.exit(EXIT_CODES.FAILURE);
  }

  const result = await job.handler();
  console.log(result.message);
  process.exit(result.success ? EXIT_CODES.SUCCESS : EXIT_CODES.FAILURE);
}

// ============================================================================
// Runner Selector
// ============================================================================

const jobName = process.argv[2];

// Help flag
if (jobName === "--help" || jobName === "-h") {
  showHelp();
  process.exit(EXIT_CODES.SUCCESS);
}

// Select runner based on config
const runnerMode = config.runnerMode;

let main: Promise<void>;

if (runnerMode === "cli") {
  // CLI mode: single command execution
  if (!jobName) {
    console.error("CLI mode requires a command. Usage: npm start -- <command>");
    showHelp();
    process.exit(EXIT_CODES.FAILURE);
  }
  main = runCli(jobName);
} else {
  // Workflow mode (default)
  main = jobName ? runSingleJob(jobName) : runWorkflow();
}

main.catch((error) => {
  logger.fatal({ error }, "Unexpected error");
  process.exit(EXIT_CODES.FAILURE);
});
