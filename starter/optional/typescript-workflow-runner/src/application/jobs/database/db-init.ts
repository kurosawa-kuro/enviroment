#!/usr/bin/env node
/**
 * Database Initialization Job
 *
 * Initializes SQLite database and runs migrations.
 * Should be run once before using other database jobs.
 *
 * Usage:
 *   npm run db-init
 *   tsx src/jobs/database/db-init.ts
 *
 * @module jobs/database/db-init
 */

import "../../../infra/config/yaml.js";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createJobWithDeps } from "../../job-factory.js";
import { registerJob } from "../../../registry/job-registry.js";
import { runIfMain } from "../../../runner/workflow-runner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationRow {
  name: string;
}

/**
 * Database initialization job
 *
 * Reads migration files from src/db/migrations/ and applies them
 * in order. Tracks applied migrations in the migrations table.
 */
export const dbInitJob = createJobWithDeps(
  {
    name: "db-init",
    description: "Initialize SQLite database and run migrations",
  },
  async (_ctx, logger, deps) => {
    const { db } = deps;
    const migrationsDir = join(__dirname, "../../../db/migrations");

    logger.info({ migrationsDir }, "Running database migrations");

    // Read migration files
    let files: string[];
    try {
      files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
    } catch {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    if (files.length === 0) {
      return {
        success: true,
        message: "No migrations found",
        metrics: { applied: 0 },
      };
    }

    let appliedCount = 0;

    for (const file of files) {
      const migrationName = file.replace(".sql", "");

      // Check if migrations table exists and migration already applied
      const tableExists = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
        )
        .get();

      if (tableExists) {
        const existing = db
          .prepare("SELECT name FROM migrations WHERE name = ?")
          .get(migrationName) as MigrationRow | undefined;

        if (existing) {
          logger.debug(
            { migration: migrationName },
            "Skipping already applied migration"
          );
          continue;
        }
      }

      // Read and execute SQL
      const sql = readFileSync(join(migrationsDir, file), "utf-8");

      try {
        db.exec(sql);
        db.prepare("INSERT INTO migrations (name) VALUES (?)").run(
          migrationName
        );
        logger.info({ migration: migrationName }, "Applied migration");
        appliedCount++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Migration failed: ${migrationName} - ${message}`);
      }
    }

    return {
      success: true,
      message:
        appliedCount > 0
          ? `Applied ${appliedCount} migration(s)`
          : "All migrations already applied",
      metrics: { applied: appliedCount },
    };
  }
);

registerJob(dbInitJob);
export const main = dbInitJob.handler;
runIfMain(main, import.meta.url);
