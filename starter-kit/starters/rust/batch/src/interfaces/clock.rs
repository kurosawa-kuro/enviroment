//! Clock Port - Time operations interface
//!
//! Enables deterministic time in tests by abstracting time operations.

use chrono::{DateTime, Utc};

/// Clock interface for time operations
pub trait Clock: Send + Sync {
    /// Get current timestamp in milliseconds since epoch
    fn now(&self) -> i64;

    /// Get current time as ISO string
    fn to_iso_string(&self) -> String;

    /// Get current time as DateTime<Utc>
    fn now_utc(&self) -> DateTime<Utc>;
}

/// Execution ID generator interface
///
/// Enables predictable IDs in tests
pub trait ExecutionIdGenerator: Send + Sync {
    /// Generate a unique execution ID
    fn generate(&self) -> String;
}
