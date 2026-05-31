/**
 * Tests for db-init job
 */

import { describe, it, expect } from "vitest";
import { dbInitJob } from "../src/application/jobs/database/db-init.js";
import { createTestContainer, createMockDb } from "./helpers/index.js";

describe("dbInitJob", () => {
  it("should have correct metadata", () => {
    expect(dbInitJob.name).toBe("db-init");
    expect(dbInitJob.description).toContain("SQLite");
    expect(typeof dbInitJob.handler).toBe("function");
  });

  it("should apply migrations to empty database", async () => {
    const container = createTestContainer({
      db: createMockDb(),
    });

    const result = await dbInitJob.handler(container);

    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.executedAt).toBeInstanceOf(Date);
  });

  it("should skip already applied migrations", async () => {
    const container = createTestContainer({
      db: createMockDb(),
    });

    // First run - apply migrations
    const result1 = await dbInitJob.handler(container);
    expect(result1.success).toBe(true);

    // Second run - should skip
    const result2 = await dbInitJob.handler(container);
    expect(result2.success).toBe(true);
    expect(result2.message).toContain("already applied");
  });
});
