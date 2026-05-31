/**
 * Test Helpers
 *
 * Utilities for testing workflow jobs with DI.
 * Provides mock factories and test container creation.
 *
 * @module test/helpers
 */

import { expect } from "vitest";
import { resetConfig } from "../../src/infra/config/yaml.js";
import {
  createTestContainer,
  createMockConfig,
  type DependencyOverrides,
  type AppConfig,
} from "../../src/di/index.js";
import type { AwilixContainer } from "awilix";
import type { Dependencies } from "../../src/di/types.js";

// ============================================================================
// Re-exports from DI module
// ============================================================================

export {
  // Container
  createTestContainer,
  // Mock factories
  createMockClock,
  createMockExecutionId,
  createMockConfig,
  createMockDb,
  createMockItemRepo,
  // Constants
  DEFAULT_TEST_CONFIG,
} from "../../src/di/index.js";

export type { DependencyOverrides, AppConfig, Dependencies } from "../../src/di/index.js";

// ============================================================================
// Environment Helpers
// ============================================================================

/**
 * Run a test with specific environment configuration
 *
 * Handles environment variable setup/teardown and config reset.
 * Prefer createTestContainerWithConfig for most cases.
 *
 * @example
 * ```typescript
 * it("should use custom db path", async () => {
 *   await withEnv({ DB_PATH: "test.db" }, async () => {
 *     const result = await job.handler();
 *     expect(result.success).toBe(true);
 *   });
 * });
 * ```
 */
export async function withEnv<T>(
  env: Record<string, string | undefined>,
  fn: () => Promise<T>
): Promise<T> {
  const saved: Record<string, string | undefined> = {};

  // Save and set
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  resetConfig();

  try {
    return await fn();
  } finally {
    // Restore
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    resetConfig();
  }
}

// ============================================================================
// Container Helpers
// ============================================================================

/**
 * Create a test container with config override via DI
 *
 * This is the preferred way to test with different configurations.
 * Avoids environment variable manipulation entirely.
 *
 * @example
 * ```typescript
 * const container = createTestContainerWithConfig({
 *   dbPath: "test.db",
 * });
 * const result = await job.handler(container);
 * ```
 */
export function createTestContainerWithConfig(
  configOverrides: Partial<AppConfig>,
  otherOverrides: Omit<DependencyOverrides, "config"> = {}
): AwilixContainer<Dependencies> {
  return createTestContainer({
    ...otherOverrides,
    config: createMockConfig(configOverrides),
  });
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert job success with optional message check
 */
export function expectJobSuccess(
  result: { success: boolean; message: string },
  expectedMessage?: string
): void {
  expect(result.success).toBe(true);
  if (expectedMessage) {
    expect(result.message).toBe(expectedMessage);
  }
}

/**
 * Assert job failure with optional message check
 */
export function expectJobFailure(
  result: { success: boolean; message: string },
  expectedMessage?: string | RegExp
): void {
  expect(result.success).toBe(false);
  if (expectedMessage) {
    if (typeof expectedMessage === "string") {
      expect(result.message).toContain(expectedMessage);
    } else {
      expect(result.message).toMatch(expectedMessage);
    }
  }
}
