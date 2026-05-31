//! System Clock Implementation
//!
//! Provides real system time using chrono.

use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::interfaces::{Clock, ExecutionIdGenerator};

/// System clock implementation using real time
pub struct SystemClock;

impl SystemClock {
    pub fn new() -> Self {
        Self
    }
}

impl Default for SystemClock {
    fn default() -> Self {
        Self::new()
    }
}

impl Clock for SystemClock {
    fn now(&self) -> i64 {
        Utc::now().timestamp_millis()
    }

    fn to_iso_string(&self) -> String {
        Utc::now().to_rfc3339()
    }

    fn now_utc(&self) -> DateTime<Utc> {
        Utc::now()
    }
}

/// System execution ID generator
///
/// Generates unique IDs in format: exec_{timestamp}_{uuid}
pub struct SystemExecutionIdGenerator;

impl SystemExecutionIdGenerator {
    pub fn new() -> Self {
        Self
    }
}

impl Default for SystemExecutionIdGenerator {
    fn default() -> Self {
        Self::new()
    }
}

impl ExecutionIdGenerator for SystemExecutionIdGenerator {
    fn generate(&self) -> String {
        let timestamp = Utc::now().timestamp_millis();
        let uuid_short = &Uuid::new_v4().to_string()[..8];
        format!("exec_{}_{}", timestamp, uuid_short)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_clock() {
        let clock = SystemClock::new();
        let now = clock.now();
        assert!(now > 0);

        let iso = clock.to_iso_string();
        assert!(iso.contains("T")); // ISO format contains T
    }

    #[test]
    fn test_execution_id_generator() {
        let gen = SystemExecutionIdGenerator::new();
        let id1 = gen.generate();
        let id2 = gen.generate();

        assert!(id1.starts_with("exec_"));
        assert!(id2.starts_with("exec_"));
        // IDs should be unique (different UUIDs)
        assert_ne!(id1, id2);
    }
}
