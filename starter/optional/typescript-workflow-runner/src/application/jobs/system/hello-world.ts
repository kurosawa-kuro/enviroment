#!/usr/bin/env node
/**
 * Hello World Workflow Step
 *
 * A simple workflow step example that can be executed via cron.
 * Works on both WSL (Linux) and Windows (Git Bash).
 *
 * Usage:
 *   npm run hello-world
 *   # or
 *   tsx src/jobs/system/hello-world.ts
 *
 * @module jobs/system/hello-world
 */

import "../../../infra/config/yaml.js";
import { createJob } from "../../job-factory.js";
import { registerJob } from "../../../registry/job-registry.js";
import { runIfMain } from "../../../runner/workflow-runner.js";
import { sleep } from "../../../shared/utils.js";

/**
 * Hello World job definition
 */
export const helloWorldJob = createJob(
  {
    name: "hello-world",
    description: "A simple hello world workflow step example",
  },
  async (_ctx, logger) => {
    // Simulate some work
    await sleep(100);

    const message = `Hello, World! Current time: ${new Date().toISOString()}`;
    logger.info({ message }, "Job executed successfully");

    return {
      success: true,
      message,
    };
  }
);

// Register with the job registry
registerJob(helloWorldJob);

// Export handler for direct execution
export const main = helloWorldJob.handler;

// Execute when run directly (CLI), skip when imported (Lambda/test)
runIfMain(main, import.meta.url);
