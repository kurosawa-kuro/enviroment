//! Hello World Batch Job
//!
//! A simple batch job example that can be executed via cron.
//!
//! Usage:
//!   cargo run -- --job hello-world

use std::sync::Arc;

use tracing::info;

use crate::application::job_factory::{create_job, JobDefinition, JobOptions};
use crate::application::job_types::JobResult;
use crate::di::AppContext;
use crate::shared::sleep_ms;

/// Create the hello-world job
pub fn hello_world_job() -> JobDefinition {
    create_job(
        JobOptions::new("hello-world", "A simple hello world batch job example"),
        |_ctx, app_ctx: Arc<AppContext>| async move {
            // Simulate some work
            sleep_ms(100).await;

            let message = format!(
                "Hello, World! Current time: {}",
                app_ctx.clock.to_iso_string()
            );

            info!(message = %message, "Job executed successfully");

            Ok(JobResult::success(message))
        },
    )
}
