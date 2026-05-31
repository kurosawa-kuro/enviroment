/**
 * Tests for item-crud job
 */

import { describe, it, expect } from "vitest";
import { itemCrudJob } from "../src/application/jobs/database/item-crud.js";
import { createTestContainer, createMockItemRepo } from "./helpers/index.js";

describe("itemCrudJob", () => {
  it("should have correct metadata", () => {
    expect(itemCrudJob.name).toBe("item-crud");
    expect(itemCrudJob.description).toContain("CRUD");
    expect(itemCrudJob.schedule).toBe("0 0 * * *");
    expect(typeof itemCrudJob.handler).toBe("function");
  });

  it("should perform CRUD operations successfully", async () => {
    const container = createTestContainer({
      itemRepo: createMockItemRepo(),
    });

    const result = await itemCrudJob.handler(container);

    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.executedAt).toBeInstanceOf(Date);
  });

  it("should report correct operation count", async () => {
    const container = createTestContainer({
      itemRepo: createMockItemRepo(),
    });

    const result = await itemCrudJob.handler(container);

    expect(result.success).toBe(true);
    expect(result.metrics?.operationsRun).toBe(5); // CREATE, READ, UPDATE, LIST, DELETE
  });

  it("should track all operations in details", async () => {
    const container = createTestContainer({
      itemRepo: createMockItemRepo(),
    });

    const result = await itemCrudJob.handler(container);

    expect(result.success).toBe(true);
    expect(result.details?.operations).toHaveLength(5);

    const operations = result.details?.operations as string[];
    expect(operations[0]).toContain("CREATE");
    expect(operations[1]).toContain("READ");
    expect(operations[2]).toContain("UPDATE");
    expect(operations[3]).toContain("LIST");
    expect(operations[4]).toContain("DELETE");
  });

  it("should clean up created item", async () => {
    const mockRepo = createMockItemRepo();
    const container = createTestContainer({
      itemRepo: mockRepo,
    });

    const result = await itemCrudJob.handler(container);

    expect(result.success).toBe(true);
    // Item should be deleted at the end
    expect(result.metrics?.itemsRemaining).toBe(0);
  });
});
