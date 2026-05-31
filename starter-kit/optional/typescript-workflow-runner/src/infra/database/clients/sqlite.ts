/**
 * SQLite Client Factory
 *
 * Creates configured SQLite database connections with:
 * - WAL mode for better concurrent access
 * - Foreign key constraint enforcement
 * - Automatic directory creation
 *
 * @module infra/database/clients/sqlite
 */

import Database from "better-sqlite3";
import { dirname } from "path";
import { mkdirSync, existsSync } from "fs";

/**
 * SQLite client configuration options
 */
export interface SqliteClientConfig {
  /** Enable verbose logging of SQL statements */
  verbose?: boolean;
}

const DEFAULT_OPTIONS: SqliteClientConfig = {
  verbose: false,
};

/**
 * Create a configured SQLite database connection
 *
 * @param dbPath - Path to the SQLite database file
 * @param options - Configuration options
 * @returns Configured database instance
 *
 * @example
 * ```typescript
 * const db = createSqliteClient('data/workflow-runner.db');
 * const stmt = db.prepare('SELECT * FROM items');
 * const rows = stmt.all();
 * db.close();
 * ```
 */
export function createSqliteClient(
  dbPath: string,
  options?: SqliteClientConfig
): Database.Database {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Create directory if it doesn't exist
  const dir = dirname(dbPath);
  if (dir !== "." && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath, {
    verbose: config.verbose ? console.log : undefined,
  });

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  // Enable foreign key constraint enforcement
  db.pragma("foreign_keys = ON");

  return db;
}
