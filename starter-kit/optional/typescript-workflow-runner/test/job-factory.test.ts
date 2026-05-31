/**
 * Tests for job-factory module
 *
 * Tests both createJob (simple) and createJobWithDeps (with DI).
 */

import { describe, it, expect } from "vitest";
import { createJob, createJobWithDeps } from "../src/application/job-factory.js";
import { createTestContainer, createMockClock, createMockItemRepo } from "./helpers/index.js";

describe("createJob", () => {
  it("should create a job with correct metadata", () => {
    const job = createJob(
      {
        name: "test-job",
        description: "A test job",
        schedule: "0 * * * *",
      },
      async () => ({
        success: true,
        message: "Test passed",
      })
    );

    expect(job.name).toBe("test-job");
    expect(job.description).toBe("A test job");
    expect(job.schedule).toBe("0 * * * *");
    expect(typeof job.handler).toBe("function");
  });

  it("should execute job and return JobResult with timing", async () => {
    const job = createJob(
      { name: "timing-test" },
      async () => ({
        success: true,
        message: "Completed",
      })
    );

    const result = await job.handler();

    expect(result.success).toBe(true);
    expect(result.message).toBe("Completed");
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.executedAt).toBeInstanceOf(Date);
  });

  it("should catch errors and return failure result", async () => {
    const job = createJob({ name: "error-test" }, async () => {
      throw new Error("Test error");
    });

    const result = await job.handler();

    expect(result.success).toBe(false);
    expect(result.message).toBe("Test error");
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.executedAt).toBeInstanceOf(Date);
  });

  it("should pass context and logger to executor", async () => {
    let receivedContext: unknown;
    let receivedLogger: unknown;

    const job = createJob({ name: "context-test" }, async (ctx, logger) => {
      receivedContext = ctx;
      receivedLogger = logger;
      return { success: true, message: "OK" };
    });

    await job.handler();

    expect(receivedContext).toBeDefined();
    expect((receivedContext as { jobName: string }).jobName).toBe(
      "context-test"
    );
    expect((receivedContext as { executionId: string }).executionId).toMatch(
      /^exec_\d+_\w+$/
    );
    expect(receivedLogger).toBeDefined();
    expect(typeof (receivedLogger as { info: unknown }).info).toBe("function");
  });
});

describe("createJobWithDeps", () => {
  it("should create a job with correct metadata", () => {
    const job = createJobWithDeps(
      {
        name: "deps-test-job",
        description: "A job with dependencies",
        schedule: "*/5 * * * *",
      },
      async () => ({
        success: true,
        message: "Done",
      })
    );

    expect(job.name).toBe("deps-test-job");
    expect(job.description).toBe("A job with dependencies");
    expect(job.schedule).toBe("*/5 * * * *");
    expect(typeof job.handler).toBe("function");
  });

  it("should pass dependencies to executor", async () => {
    let receivedDeps: unknown;

    const job = createJobWithDeps(
      { name: "deps-check" },
      async (_ctx, _logger, deps) => {
        receivedDeps = deps;
        return { success: true, message: "OK" };
      }
    );

    const container = createTestContainer();
    await job.handler(container);

    expect(receivedDeps).toBeDefined();
    expect((receivedDeps as { clock: unknown }).clock).toBeDefined();
    expect((receivedDeps as { itemRepo: unknown }).itemRepo).toBeDefined();
    expect((receivedDeps as { config: unknown }).config).toBeDefined();
  });

  it("should use mock clock from test container", async () => {
    const fixedTime = 1700000000000;
    const mockClock = createMockClock({ fixedTime });

    const job = createJobWithDeps(
      { name: "clock-test" },
      async (_ctx, _logger, deps) => {
        return {
          success: true,
          message: `Time: ${deps.clock.now()}`,
        };
      }
    );

    const container = createTestContainer({ clock: mockClock });
    const result = await job.handler(container);

    expect(result.success).toBe(true);
    expect(result.message).toBe(`Time: ${fixedTime}`);
  });

  it("should use mock item repository from test container", async () => {
    const mockRepo = createMockItemRepo();
    mockRepo.create({ name: "Test Item" });

    const job = createJobWithDeps(
      { name: "repo-test" },
      async (_ctx, _logger, deps) => {
        const items = deps.itemRepo.list();
        return {
          success: true,
          message: `Found ${items.length} items`,
        };
      }
    );

    const container = createTestContainer({ itemRepo: mockRepo });
    const result = await job.handler(container);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Found 1 items");
  });

  it("should catch errors and return failure result", async () => {
    const job = createJobWithDeps({ name: "deps-error-test" }, async () => {
      throw new Error("Dependency error");
    });

    const container = createTestContainer();
    const result = await job.handler(container);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Dependency error");
  });
});
