/**
 * DI Container Module
 *
 * Centralized dependency injection for workflow jobs.
 *
 * @module di
 *
 * @example
 * ```typescript
 * // Production usage
 * import { container, resolve } from "./di/index.js";
 *
 * const clock = resolve("clock");
 * console.log(clock.now());
 *
 * // Test usage
 * import {
 *   createTestContainer,
 *   createMockItemRepo,
 * } from "./di/index.js";
 *
 * const testContainer = createTestContainer({
 *   itemRepo: createMockItemRepo(),
 * });
 * ```
 */

// Types
export type {
  Clock,
  ExecutionIdGenerator,
  ConfigProvider,
  AppConfig,
  Dependencies,
  DependencyOverrides,
} from "./types.js";

// Container
export {
  createProductionContainer,
  createTestContainer,
  container,
  resolve,
} from "./container.js";

// Mocks
export {
  // Clock
  createMockClock,
  type MockClockOptions,
  // Execution ID
  createMockExecutionId,
  type MockExecutionIdOptions,
  // Config
  createMockConfig,
  type MockConfigOptions,
  DEFAULT_TEST_CONFIG,
  // Database
  createMockDb,
  // Item Repository
  createMockItemRepo,
} from "./mocks.js";
