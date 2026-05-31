//! Workflow Runner - Job Execution Engine
//!
//! Provides utilities for executing jobs (workflow steps) in a controlled manner.
//!
//! ## Responsibilities
//! - Execute jobs in defined order
//! - Control success/failure flow
//! - Handle process exit codes

use std::sync::Arc;

use tracing::{error, info, warn};

use crate::application::JobResult;
use crate::di::AppContext;
use crate::registry::{get_all_jobs, get_job};
use crate::shared::exit_codes;

/// Execute a single workflow step by name
pub async fn run_step(job_name: &str, ctx: Arc<AppContext>) -> Option<JobResult> {
    let job = match get_job(job_name) {
        Some(j) => j,
        None => {
            let available: Vec<_> = get_all_jobs().iter().map(|j| j.name.clone()).collect();
            error!(
                job_name = %job_name,
                available_jobs = ?available,
                "Workflow step not found"
            );
            return None;
        }
    };

    info!(job = %job_name, "Starting workflow step");
    Some(job.execute(ctx).await)
}

/// Execute all workflow steps in sequence
pub async fn run_workflow(ctx: Arc<AppContext>) -> i32 {
    let jobs = get_all_jobs();

    if jobs.is_empty() {
        warn!("No workflow steps registered");
        return exit_codes::SUCCESS;
    }

    let job_names: Vec<_> = jobs.iter().map(|j| j.name.clone()).collect();
    info!(steps = ?job_names, "Starting workflow");

    let mut has_failure = false;

    for job in jobs {
        let result = job.execute(ctx.clone()).await;
        if !result.success {
            has_failure = true;
            error!(job = %job.name, "Workflow step failed, continuing...");
        }
    }

    info!(success = %!has_failure, "Workflow completed");

    if has_failure {
        exit_codes::FAILURE
    } else {
        exit_codes::SUCCESS
    }
}

/// Execute a specific workflow step by name
pub async fn run_single_job(job_name: &str, ctx: Arc<AppContext>) -> i32 {
    match run_step(job_name, ctx).await {
        Some(result) => {
            if result.success {
                exit_codes::SUCCESS
            } else {
                exit_codes::FAILURE
            }
        }
        None => exit_codes::FAILURE,
    }
}
