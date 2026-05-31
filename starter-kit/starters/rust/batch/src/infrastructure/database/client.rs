//! SQLite Client Factory
//!
//! Creates configured SQLite database connections with:
//! - WAL mode for better concurrent access
//! - Foreign key constraint enforcement
//! - Automatic directory creation

use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;
use tracing::debug;

use super::errors::DbError;

/// SQLite client configuration options
#[derive(Debug, Clone, Default)]
pub struct SqliteClientConfig {
    /// Enable verbose logging of SQL statements
    pub verbose: bool,
}

/// Thread-safe SQLite connection wrapper
pub type SqliteDb = Arc<Mutex<Connection>>;

/// Create a configured SQLite database connection
///
/// # Arguments
///
/// * `db_path` - Path to the SQLite database file
/// * `config` - Optional configuration
///
/// # Returns
///
/// Thread-safe connection wrapper
///
/// # Example
///
/// ```ignore
/// let db = create_sqlite_client("data/batch.db", None)?;
/// let conn = db.lock().unwrap();
/// conn.execute("SELECT 1", [])?;
/// ```
pub fn create_sqlite_client(
    db_path: &str,
    config: Option<SqliteClientConfig>,
) -> Result<SqliteDb, DbError> {
    let _config = config.unwrap_or_default();

    // Create directory if it doesn't exist
    if let Some(parent) = Path::new(db_path).parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| DbError::new(format!("Failed to create directory: {}", e), "init"))?;
        }
    }

    debug!("Opening SQLite database: {}", db_path);

    let conn = Connection::open(db_path)
        .map_err(|e| DbError::with_source(format!("Failed to open database: {}", e), "init", e))?;

    // Enable WAL mode for better concurrency
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| DbError::with_source("Failed to set WAL mode".to_string(), "init", e))?;

    // Enable foreign key constraint enforcement
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| {
            DbError::with_source("Failed to enable foreign keys".to_string(), "init", e)
        })?;

    Ok(Arc::new(Mutex::new(conn)))
}

/// Create an in-memory SQLite database (useful for testing)
pub fn create_memory_db() -> Result<SqliteDb, DbError> {
    let conn = Connection::open_in_memory().map_err(|e| {
        DbError::with_source("Failed to open in-memory database".to_string(), "init", e)
    })?;

    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| {
            DbError::with_source("Failed to enable foreign keys".to_string(), "init", e)
        })?;

    Ok(Arc::new(Mutex::new(conn)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_create_sqlite_client() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");

        let db = create_sqlite_client(db_path.to_str().unwrap(), None).unwrap();
        let conn = db.lock().unwrap();

        // Verify WAL mode
        let mode: String = conn
            .pragma_query_value(None, "journal_mode", |row| row.get(0))
            .unwrap();
        assert_eq!(mode.to_lowercase(), "wal");

        // Verify foreign keys
        let fk: i32 = conn
            .pragma_query_value(None, "foreign_keys", |row| row.get(0))
            .unwrap();
        assert_eq!(fk, 1);
    }

    #[test]
    fn test_create_memory_db() {
        let db = create_memory_db().unwrap();
        let conn = db.lock().unwrap();

        conn.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)", [])
            .unwrap();
        conn.execute("INSERT INTO test (id) VALUES (1)", [])
            .unwrap();

        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM test", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }
}
