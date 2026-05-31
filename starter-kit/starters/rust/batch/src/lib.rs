//! Batch - Workflow Runner for Batch Job Execution
//!
//! A Rust implementation of a batch job workflow runner with clean architecture.
//!
//! ## Architecture
//!
//! - **shared**: Constants and utility functions
//! - **interfaces**: Trait definitions (ports)
//! - **infrastructure**: Concrete implementations (adapters)
//! - **domain**: Business entities and repository interfaces
//! - **application**: Job definitions and factory
//! - **registry**: Job registration and lookup
//! - **runner**: Workflow execution engine
//! - **di**: Dependency injection container
//!
//! ## Usage
//!
//! ```bash
//! # Run full workflow (all jobs sequentially)
//! cargo run
//!
//! # Run specific job
//! cargo run -- --job hello-world
//!
//! # List available jobs
//! cargo run -- --list
//! ```

pub mod application;
pub mod di;
pub mod domain;
pub mod infrastructure;
pub mod interfaces;
pub mod registry;
pub mod runner;
pub mod shared;

// Re-exports for convenience
pub use application::{create_job, register_all_jobs, JobDefinition, JobOptions, JobResult};
pub use di::{AppContext, TestContextBuilder};
pub use domain::{Item, ItemRepository, NewItem, UpdateItem};
pub use infrastructure::{get_config, init_config};
pub use interfaces::{AppConfig, Clock, ConfigProvider, ExecutionIdGenerator};
pub use registry::{get_all_jobs, get_job, register_job};
pub use runner::{run_single_job, run_workflow};
pub use shared::{exit_codes, timeouts, Timer};
