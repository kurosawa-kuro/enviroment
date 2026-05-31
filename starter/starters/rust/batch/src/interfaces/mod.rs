//! Interface definitions (Ports)
//!
//! Defines traits that abstract external dependencies for testability.

pub mod clock;
pub mod config;

pub use clock::{Clock, ExecutionIdGenerator};
pub use config::{AppConfig, ConfigProvider};
