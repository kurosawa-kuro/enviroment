//! Application layer
//!
//! Contains job definitions and the job factory.

pub mod job_factory;
pub mod job_types;
pub mod jobs;

pub use job_factory::{create_job, JobDefinition, JobOptions};
pub use job_types::{JobContext, JobError, JobResult, PartialJobResult};
pub use jobs::register_all_jobs;
