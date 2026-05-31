//! Common Types for Workflow Steps (Jobs)
//!
//! Core type definitions used throughout the workflow-runner system.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Workflow step result - what a job returns after execution
///
/// Every job (workflow step) must return this structure.
/// The runner uses this to determine workflow success/failure.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobResult {
    /// Whether the workflow step succeeded
    pub success: bool,
    /// Human-readable result message
    pub message: String,
    /// When the step was executed (auto-filled by factory)
    pub executed_at: DateTime<Utc>,
    /// Execution time in milliseconds (auto-filled by factory)
    pub duration_ms: u64,
    /// Numeric metrics for monitoring
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metrics: Option<HashMap<String, i64>>,
    /// Additional structured details
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl JobResult {
    /// Create a successful result
    pub fn success(message: impl Into<String>) -> PartialJobResult {
        PartialJobResult {
            success: true,
            message: message.into(),
            metrics: None,
            details: None,
        }
    }

    /// Create a failed result
    pub fn failure(message: impl Into<String>) -> PartialJobResult {
        PartialJobResult {
            success: false,
            message: message.into(),
            metrics: None,
            details: None,
        }
    }
}

/// Partial job result (without timing info)
///
/// This is what job executors return. The factory fills in
/// executed_at and duration_ms.
#[derive(Debug, Clone)]
pub struct PartialJobResult {
    pub success: bool,
    pub message: String,
    pub metrics: Option<HashMap<String, i64>>,
    pub details: Option<serde_json::Value>,
}

impl PartialJobResult {
    /// Add metrics to the result
    pub fn with_metrics(mut self, metrics: HashMap<String, i64>) -> Self {
        self.metrics = Some(metrics);
        self
    }

    /// Add a single metric
    pub fn with_metric(mut self, key: impl Into<String>, value: i64) -> Self {
        self.metrics
            .get_or_insert_with(HashMap::new)
            .insert(key.into(), value);
        self
    }

    /// Add details to the result
    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }

    /// Convert to full JobResult with timing info
    pub fn finalize(self, executed_at: DateTime<Utc>, duration_ms: u64) -> JobResult {
        JobResult {
            success: self.success,
            message: self.message,
            executed_at,
            duration_ms,
            metrics: self.metrics,
            details: self.details,
        }
    }
}

/// Job context passed to job executors
///
/// Contains information about the current execution
#[derive(Debug, Clone)]
pub struct JobContext {
    /// Name of the job being executed
    pub job_name: String,
    /// Unique identifier for this execution (for tracing)
    pub execution_id: String,
    /// Timestamp when the job started (milliseconds since epoch)
    pub start_time: i64,
}

/// Job execution error
#[derive(Error, Debug)]
pub enum JobError {
    #[error("Job failed: {0}")]
    ExecutionFailed(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("{0}")]
    Other(#[from] anyhow::Error),
}

impl JobError {
    pub fn execution(msg: impl Into<String>) -> Self {
        Self::ExecutionFailed(msg.into())
    }

    pub fn config(msg: impl Into<String>) -> Self {
        Self::ConfigError(msg.into())
    }

    pub fn database(msg: impl Into<String>) -> Self {
        Self::DatabaseError(msg.into())
    }
}
