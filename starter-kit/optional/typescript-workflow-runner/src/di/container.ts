/**
 * DI Container Implementation
 *
 * Production container with real implementations.
 * Test container factory for testing with mocks.
 *
 * @module lib/di/container
 */

import {
  createContainer,
  asFunction,
  asValue,
  type AwilixContainer,
} from "awilix";
import { resolve as pathResolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { Dependencies, DependencyOverrides } from "./types.js";
import { getConfig } from "../infra/config/yaml.js";
import { createSqliteClient } from "../infra/database/clients/sqlite.js";
import { createItemSqliteRepository } from "../infra/repositories/item/sqlite.js";
import {
  createSystemClock,
  createExecutionIdGenerator,
} from "../infra/clock/system.js";
import {
  createMockClock,
  createMockExecutionId,
  createMockConfig,
  createMockDb,
  createMockItemRepo,
} from "./mocks.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Production Container
// ============================================================================

/**
 * Create the production container with real implementations
 */
export function createProductionContainer(): AwilixContainer<Dependencies> {
  const container = createContainer<Dependencies>();

  container.register({
    // Time (from infra/clock)
    clock: asFunction(() => createSystemClock()).singleton(),

    // Identity (from infra/clock)
    executionId: asFunction(() => createExecutionIdGenerator()).singleton(),

    // Configuration
    config: asFunction(() => ({
      get: () => getConfig(),
    })).singleton(),

    // SQLite Database
    db: asFunction(() => {
      const config = getConfig();
      const dbPath = pathResolve(__dirname, "../../", config.dbPath);
      return createSqliteClient(dbPath);
    }).singleton(),

    // Item Repository
    itemRepo: asFunction(({ db }) => createItemSqliteRepository({ db })).singleton(),
  });

  return container;
}

// ============================================================================
// Test Container
// ============================================================================

/**
 * Create a test container with mock implementations
 *
 * @param overrides - Partial dependencies to override defaults
 * @returns Container with mock implementations
 *
 * @example
 * ```typescript
 * // Default mocks
 * const container = createTestContainer();
 *
 * // Custom mock item repository
 * const container = createTestContainer({
 *   itemRepo: createMockItemRepo(),
 * });
 *
 * // Custom config
 * const container = createTestContainer({
 *   config: createMockConfig({ dbPath: "test.db" }),
 * });
 * ```
 */
export function createTestContainer(
  overrides: DependencyOverrides = {}
): AwilixContainer<Dependencies> {
  const container = createContainer<Dependencies>();

  container.register({
    clock: asValue(overrides.clock ?? createMockClock()),
    executionId: asValue(overrides.executionId ?? createMockExecutionId()),
    config: asValue(overrides.config ?? createMockConfig()),
    db: asValue(overrides.db ?? createMockDb()),
    itemRepo: asValue(overrides.itemRepo ?? createMockItemRepo()),
  });

  return container;
}

// ============================================================================
// Container Singleton
// ============================================================================

/**
 * Default production container instance
 */
export const container = createProductionContainer();

/**
 * Resolve a dependency from the production container
 */
export function resolve<K extends keyof Dependencies>(key: K): Dependencies[K] {
  return container.resolve(key);
}
