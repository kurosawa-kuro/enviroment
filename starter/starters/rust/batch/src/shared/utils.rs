//! Utility functions for batch jobs
//!
//! Provides common utilities like timers, sleep, and string masking.

use std::time::{Duration, Instant};

/// Timer utility for measuring elapsed time
pub struct Timer {
    start: Instant,
}

impl Timer {
    /// Create a new timer starting from now
    pub fn new() -> Self {
        Self {
            start: Instant::now(),
        }
    }

    /// Get elapsed time in milliseconds
    pub fn elapsed_ms(&self) -> u64 {
        self.start.elapsed().as_millis() as u64
    }

    /// Get elapsed time as formatted string (e.g., "123ms")
    pub fn elapsed_formatted(&self) -> String {
        format!("{}ms", self.elapsed_ms())
    }

    /// Get the start instant
    pub fn start_time(&self) -> Instant {
        self.start
    }
}

impl Default for Timer {
    fn default() -> Self {
        Self::new()
    }
}

/// Sleep for the specified duration
pub async fn sleep(duration: Duration) {
    tokio::time::sleep(duration).await;
}

/// Sleep for the specified milliseconds
pub async fn sleep_ms(ms: u64) {
    sleep(Duration::from_millis(ms)).await;
}

/// Mask sensitive information in connection strings
///
/// Handles various URI formats including database connection strings.
///
/// # Examples
///
/// ```
/// use batch::shared::utils::mask_connection_string;
///
/// let masked = mask_connection_string("postgres://user:password@localhost:5432/db");
/// assert_eq!(masked, "postgres://user:****@localhost:5432/db");
/// ```
pub fn mask_connection_string(uri: &str) -> String {
    // Handle standard URI format: scheme://user:password@host
    // The password can contain URL-encoded special characters
    let re = regex_lite::Regex::new(r"(://[^:]+:)([^@]+)(@)").unwrap();
    if re.is_match(uri) {
        re.replace(uri, "$1****$3").to_string()
    } else {
        "[URI masked]".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timer() {
        let timer = Timer::new();
        std::thread::sleep(Duration::from_millis(10));
        assert!(timer.elapsed_ms() >= 10);
    }

    #[test]
    fn test_mask_connection_string() {
        assert_eq!(
            mask_connection_string("postgres://user:secret@localhost:5432/db"),
            "postgres://user:****@localhost:5432/db"
        );
        assert_eq!(
            mask_connection_string("mongodb+srv://admin:p%40ss@cluster.mongodb.net/db"),
            "mongodb+srv://admin:****@cluster.mongodb.net/db"
        );
        assert_eq!(mask_connection_string("invalid"), "[URI masked]");
    }
}
