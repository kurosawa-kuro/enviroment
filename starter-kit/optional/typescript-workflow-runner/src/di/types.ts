/**
 * DI Container Type Definitions
 *
 * Re-exports interface types and defines the Dependencies container.
 *
 * @module di/types
 */

import type Database from "better-sqlite3";
import type { ItemRepository } from "../domain/repositories/item.js";

// Re-export interfaces from interfaces/
export type {
  Clock,
  ExecutionIdGenerator,
  AppConfig,
  ConfigProvider,
  Logger,
} from "../interfaces/index.js";

// Import for local use
import type {
  Clock,
  ExecutionIdGenerator,
  ConfigProvider,
} from "../interfaces/index.js";

// ============================================================================
// Dependencies Container
// ============================================================================

/**
 * All injectable dependencies
 *
 * Add new dependencies here when extending the DI system.
 * Each dependency should have a corresponding interface in interfaces/.
 */
export interface Dependencies {
  clock: Clock;
  executionId: ExecutionIdGenerator;
  config: ConfigProvider;
  db: Database.Database;
  itemRepo: ItemRepository;
}

/**
 * Partial dependencies for test container overrides
 */
export type DependencyOverrides = Partial<Dependencies>;
