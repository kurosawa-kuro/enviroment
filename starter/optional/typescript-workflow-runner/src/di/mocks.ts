/**
 * Mock Factories for Testing
 *
 * Provides factory functions to create mock implementations
 * of all injectable dependencies.
 *
 * @module lib/di/mocks
 */

import Database from "better-sqlite3";
import type {
  Clock,
  ExecutionIdGenerator,
  ConfigProvider,
  AppConfig,
} from "./types.js";
import type { ItemRepository } from "../domain/repositories/item.js";
import type { Item } from "../domain/entities/item.js";

// ============================================================================
// Clock Mocks
// ============================================================================

/**
 * Options for creating a mock clock
 */
export interface MockClockOptions {
  /** Fixed timestamp (default: 1700000000000 = 2023-11-14) */
  fixedTimestamp?: number;
  /** Fixed ISO string (auto-generated from timestamp if not provided) */
  fixedIsoString?: string;
}

/**
 * Create a mock clock with fixed time
 */
export function createMockClock(options: MockClockOptions = {}): Clock {
  const timestamp = options.fixedTimestamp ?? 1700000000000;
  const isoString =
    options.fixedIsoString ?? new Date(timestamp).toISOString();

  return {
    now: () => timestamp,
    toISOString: () => isoString,
  };
}

// ============================================================================
// Execution ID Mocks
// ============================================================================

/**
 * Options for creating a mock execution ID generator
 */
export interface MockExecutionIdOptions {
  /** Fixed execution ID (default: "exec_test_123456") */
  fixedId?: string;
  /** Sequence of IDs to return (cycles through) */
  sequence?: string[];
}

/**
 * Create a mock execution ID generator
 */
export function createMockExecutionId(
  options: MockExecutionIdOptions = {}
): ExecutionIdGenerator {
  if (options.sequence && options.sequence.length > 0) {
    let index = 0;
    return {
      generate: () => {
        const id = options.sequence![index % options.sequence!.length];
        index++;
        return id;
      },
    };
  }

  const fixedId = options.fixedId ?? "exec_test_123456";
  return {
    generate: () => fixedId,
  };
}

// ============================================================================
// Config Mocks
// ============================================================================

/**
 * Options for creating a mock config provider
 */
export interface MockConfigOptions extends Partial<AppConfig> {}

/**
 * Default test configuration
 */
export const DEFAULT_TEST_CONFIG: AppConfig = {
  projectName: "batch-test",
  appEnv: "test",
  runnerMode: "workflow",
  logLevel: "silent",
  dbPath: ":memory:",
};

/**
 * Create a mock config provider
 */
export function createMockConfig(
  options: MockConfigOptions = {}
): ConfigProvider {
  const config: AppConfig = {
    ...DEFAULT_TEST_CONFIG,
    ...options,
  };

  return {
    get: () => config,
  };
}

// ============================================================================
// Database Mocks
// ============================================================================

/**
 * Create an in-memory SQLite database for testing
 *
 * The database is automatically configured with WAL mode and foreign keys,
 * and includes the standard schema (migrations and items tables).
 */
export function createMockDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables for testing
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
  `);

  return db;
}

// ============================================================================
// Item Repository Mocks
// ============================================================================

/**
 * Create an in-memory mock item repository for testing
 *
 * Provides a fully functional repository implementation that stores
 * items in memory, useful for testing jobs without database dependencies.
 */
export function createMockItemRepo(): ItemRepository {
  let items: Item[] = [];
  let nextId = 1;

  return {
    create(data) {
      const now = new Date();
      const item: Item = {
        id: nextId++,
        name: data.name,
        createdAt: now,
        updatedAt: now,
      };
      items.push(item);
      return item;
    },

    get(id) {
      return items.find((i) => i.id === id) ?? null;
    },

    list() {
      return [...items].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    },

    update(id, data) {
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return null;

      const existing = items[index];
      const updated: Item = {
        ...existing,
        name: data.name ?? existing.name,
        updatedAt: new Date(),
      };
      items[index] = updated;
      return updated;
    },

    delete(id) {
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return false;
      items.splice(index, 1);
      return true;
    },
  };
}
