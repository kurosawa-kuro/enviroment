//! Job Factory - Creates Workflow Steps
//!
//! Factory functions for creating standardized jobs (workflow steps).
//! Jobs created by this factory are the building blocks of workflows.
//!
//! ## What is a Job?
//! A job is a **workflow step** - a single unit of work that:
//! - Takes input (via context and dependencies)
//! - Performs processing
//! - Returns a result (success/failure with message)
//!
//! ## Responsibilities
//! - Create job instances from configuration
//! - Wire up dependency injection
//! - Automate timing, logging, and error handling

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use tracing::{error, info, Span};

use crate::application::job_types::{JobContext, JobResult, PartialJobResult};
use crate::di::AppContext;
use crate::shared::Timer;

/// Job executor function type
///
/// Receives job context and app context, returns partial result
pub type JobExecutor = Arc<
    dyn Fn(
            JobContext,
            Arc<AppContext>,
        ) -> Pin<Box<dyn Future<Output = Result<PartialJobResult, anyhow::Error>> + Send>>
        + Send
        + Sync,
>;

/// Options for creating a job (workflow step)
#[derive(Debug, Clone)]
pub struct JobOptions {
    /// Unique job name - identifies this workflow step
    pub name: String,
    /// Human-readable description of what this step does
    pub description: String,
    /// Recommended cron schedule (informational only - not enforced)
    pub schedule: Option<String>,
    /// Maximum execution time in milliseconds
    pub timeout_ms: Option<u64>,
}

impl JobOptions {
    pub fn new(name: impl Into<String>, description: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            description: description.into(),
            schedule: None,
            timeout_ms: None,
        }
    }

    pub fn with_schedule(mut self, schedule: impl Into<String>) -> Self {
        self.schedule = Some(schedule.into());
        self
    }

    pub fn with_timeout(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = Some(timeout_ms);
        self
    }
}

/// Job definition - a configured workflow step ready for execution
///
/// This is what the factory returns. The handler can be invoked by the
/// workflow runner to execute this step.
#[derive(Clone)]
pub struct JobDefinition {
    /// Unique identifier for this workflow step
    pub name: String,
    /// Human-readable description
    pub description: String,
    /// Recommended cron schedule (informational)
    pub schedule: Option<String>,
    /// Maximum execution time in milliseconds
    pub timeout_ms: Option<u64>,
    /// The executor function
    executor: JobExecutor,
}

impl JobDefinition {
    /// Execute this workflow step
    pub async fn execute(&self, ctx: Arc<AppContext>) -> JobResult {
        let timer = Timer::new();
        let execution_id = ctx.execution_id.generate();

        let job_ctx = JobContext {
            job_name: self.name.clone(),
            execution_id: execution_id.clone(),
            start_time: ctx.clock.now(),
        };

        let span = Span::current();
        span.record("job", &self.name);
        span.record("execution_id", &execution_id);

        info!(
            job = %self.name,
            execution_id = %execution_id,
            "Job started"
        );

        let result = (self.executor)(job_ctx, ctx.clone()).await;

        let duration_ms = timer.elapsed_ms();
        let executed_at = ctx.clock.now_utc();

        match result {
            Ok(partial) => {
                info!(
                    job = %self.name,
                    duration_ms = %duration_ms,
                    success = %partial.success,
                    "Job completed"
                );
                partial.finalize(executed_at, duration_ms)
            }
            Err(e) => {
                error!(
                    job = %self.name,
                    duration_ms = %duration_ms,
                    error = %e,
                    "Job failed"
                );
                JobResult {
                    success: false,
                    message: e.to_string(),
                    executed_at,
                    duration_ms,
                    metrics: None,
                    details: None,
                }
            }
        }
    }
}

/// Create a standardized job with automatic timing, logging, and error handling
///
/// # Example
///
/// ```ignore
/// let job = create_job(
///     JobOptions::new("hello-world", "A simple hello world job"),
///     |ctx, app_ctx| Box::pin(async move {
///         Ok(JobResult::success("Hello, World!"))
///     })
/// );
/// ```
pub fn create_job<F, Fut>(options: JobOptions, executor: F) -> JobDefinition
where
    F: Fn(JobContext, Arc<AppContext>) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<PartialJobResult, anyhow::Error>> + Send + 'static,
{
    let executor = Arc::new(move |ctx: JobContext, app_ctx: Arc<AppContext>| {
        let fut = executor(ctx, app_ctx);
        Box::pin(fut)
            as Pin<Box<dyn Future<Output = Result<PartialJobResult, anyhow::Error>> + Send>>
    });

    JobDefinition {
        name: options.name,
        description: options.description,
        schedule: options.schedule,
        timeout_ms: options.timeout_ms,
        executor,
    }
}
