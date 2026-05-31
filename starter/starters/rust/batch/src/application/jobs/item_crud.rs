//! Item CRUD Sample Job
//!
//! Demonstrates basic CRUD operations on SQLite items table.
//! Creates, reads, updates, and deletes sample items.
//!
//! Usage:
//!   cargo run -- --job item-crud

use std::sync::Arc;

use serde_json::json;
use tracing::info;

use crate::application::job_factory::{create_job, JobDefinition, JobOptions};
use crate::application::job_types::JobResult;
use crate::di::AppContext;
use crate::domain::{NewItem, UpdateItem};

/// Create the item-crud job
pub fn item_crud_job() -> JobDefinition {
    create_job(
        JobOptions::new("item-crud", "Demonstrates CRUD operations on items table")
            .with_schedule("0 0 * * *"), // Daily at midnight
        |_ctx, app_ctx: Arc<AppContext>| async move {
            let mut operations: Vec<String> = Vec::new();

            // CREATE
            info!("Creating sample item...");
            let created = app_ctx.item_repo.create(NewItem {
                name: format!("Sample Item {}", app_ctx.clock.to_iso_string()),
            })?;
            operations.push(format!("CREATE: id={}, name={}", created.id, created.name));
            info!(item_id = %created.id, item_name = %created.name, "Created item");

            // READ
            info!(id = %created.id, "Reading item...");
            if let Some(retrieved) = app_ctx.item_repo.get(created.id)? {
                operations.push(format!(
                    "READ: id={}, name={}",
                    retrieved.id, retrieved.name
                ));
                info!(item_id = %retrieved.id, item_name = %retrieved.name, "Retrieved item");
            }

            // UPDATE
            info!(id = %created.id, "Updating item...");
            if let Some(updated) = app_ctx.item_repo.update(
                created.id,
                UpdateItem {
                    name: Some(format!("Updated Item {}", app_ctx.clock.to_iso_string())),
                },
            )? {
                operations.push(format!("UPDATE: id={}, name={}", updated.id, updated.name));
                info!(item_id = %updated.id, item_name = %updated.name, "Updated item");
            }

            // LIST
            info!("Listing all items...");
            let all_items = app_ctx.item_repo.list()?;
            operations.push(format!("LIST: {} items total", all_items.len()));
            info!(count = %all_items.len(), "Listed items");

            // // DELETE
            // info!(id = %created.id, "Deleting item...");
            // let deleted = app_ctx.item_repo.delete(created.id)?;
            // operations.push(format!("DELETE: id={}, success={}", created.id, deleted));
            // info!(deleted = %deleted, "Deleted item");

            // Final count
            let final_count = app_ctx.item_repo.list()?.len() as i64;

            Ok(JobResult::success(format!(
                "CRUD operations completed. {} items remaining.",
                final_count
            ))
            .with_metric("operations_run", operations.len() as i64)
            .with_metric("items_remaining", final_count)
            .with_details(json!({ "operations": operations })))
        },
    )
}
