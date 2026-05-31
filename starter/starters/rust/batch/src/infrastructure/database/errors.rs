//! Database Error Handling
//!
//! Provides centralized error handling for database operations
//! with context tracking for better debugging.

use thiserror::Error;

/// Database operation error
#[derive(Error, Debug)]
#[error("Database error in {context}: {message}")]
pub struct DbError {
    /// Error message
    pub message: String,
    /// Operation context (e.g., "item.create")
    pub context: String,
    /// Original error source
    #[source]
    pub source: Option<rusqlite::Error>,
}

impl DbError {
    pub fn new(message: impl Into<String>, context: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            context: context.into(),
            source: None,
        }
    }

    pub fn with_source(
        message: impl Into<String>,
        context: impl Into<String>,
        source: rusqlite::Error,
    ) -> Self {
        Self {
            message: message.into(),
            context: context.into(),
            source: Some(source),
        }
    }
}

/// Wrap a database operation with error handling
///
/// # Example
///
/// ```ignore
/// let item = wrap_db_operation(|| {
///     conn.query_row("SELECT * FROM items WHERE id = ?", [id], |row| {
///         Ok(Item { id: row.get(0)?, name: row.get(1)? })
///     })
/// }, "item.get")?;
/// ```
pub fn wrap_db_operation<T, F>(operation: F, context: &str) -> Result<T, DbError>
where
    F: FnOnce() -> Result<T, rusqlite::Error>,
{
    operation().map_err(|e| DbError::with_source(e.to_string(), context, e))
}
