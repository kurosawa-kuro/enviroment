//! Database Initialization Job
//!
//! Initializes SQLite database and runs migrations.
//! Should be run once before using other database jobs.
//!
//! Usage:
//!   cargo run -- --job db-init

use std::fs;
use std::path::Path;
use std::sync::Arc;

use tracing::{debug, info};

use crate::application::job_factory::{create_job, JobDefinition, JobOptions};
use crate::application::job_types::JobResult;
use crate::di::AppContext;

/// Create the db-init job
pub fn db_init_job() -> JobDefinition {
    create_job(
        JobOptions::new("db-init", "Initialize SQLite database and run migrations"),
        |_ctx, app_ctx: Arc<AppContext>| async move {
            let migrations_dir = Path::new("db/migrations");

            info!(migrations_dir = ?migrations_dir, "Running database migrations");

            // Read migration files
            let files = if migrations_dir.exists() {
                let mut files: Vec<_> = fs::read_dir(migrations_dir)?
                    .filter_map(|entry| entry.ok())
                    .filter(|entry| {
                        entry
                            .path()
                            .extension()
                            .map(|ext| ext == "sql")
                            .unwrap_or(false)
                    })
                    .map(|entry| entry.path())
                    .collect();
                files.sort();
                files
            } else {
                return Ok(
                    JobResult::success("No migrations directory found").with_metric("applied", 0)
                );
            };

            if files.is_empty() {
                return Ok(JobResult::success("No migrations found").with_metric("applied", 0));
            }

            let mut applied_count = 0;

            let db = app_ctx.db.lock().map_err(|e| anyhow::anyhow!("{}", e))?;

            for file_path in files {
                let migration_name = file_path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown");

                // Check if migrations table exists
                let table_exists: bool = db
                    .query_row(
                        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='migrations'",
                        [],
                        |row| row.get::<_, i32>(0),
                    )
                    .map(|count| count > 0)
                    .unwrap_or(false);

                if table_exists {
                    // Check if migration already applied
                    let existing: bool = db
                        .query_row(
                            "SELECT COUNT(*) FROM migrations WHERE name = ?1",
                            [migration_name],
                            |row| row.get::<_, i32>(0),
                        )
                        .map(|count| count > 0)
                        .unwrap_or(false);

                    if existing {
                        debug!(migration = %migration_name, "Skipping already applied migration");
                        continue;
                    }
                }

                // Read and execute SQL
                let sql = fs::read_to_string(&file_path)?;

                db.execute_batch(&sql)?;

                // Record migration (table should exist now after first migration)
                db.execute(
                    "INSERT INTO migrations (name) VALUES (?1)",
                    [migration_name],
                )?;

                info!(migration = %migration_name, "Applied migration");
                applied_count += 1;
            }

            let message = if applied_count > 0 {
                format!("Applied {} migration(s)", applied_count)
            } else {
                "All migrations already applied".to_string()
            };

            Ok(JobResult::success(message).with_metric("applied", applied_count))
        },
    )
}
