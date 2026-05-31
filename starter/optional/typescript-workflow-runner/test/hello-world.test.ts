/**
 * Tests for hello-world job
 */

import { describe, it, expect } from "vitest";
import { helloWorldJob } from "../src/application/jobs/system/hello-world.js";

describe("helloWorldJob", () => {
  it("should have correct metadata", () => {
    expect(helloWorldJob.name).toBe("hello-world");
    expect(helloWorldJob.description).toBe(
      "A simple hello world workflow step example"
    );
  });

  it("should execute successfully", async () => {
    const result = await helloWorldJob.handler();

    expect(result.success).toBe(true);
    expect(result.message).toMatch(/^Hello, World!/);
    expect(result.message).toContain("Current time:");
    expect(result.duration).toBeGreaterThanOrEqual(100); // Sleep for 100ms
    expect(result.executedAt).toBeInstanceOf(Date);
  });
});
