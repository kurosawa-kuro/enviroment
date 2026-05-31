//! Application constants
//!
//! Defines common constants used throughout the application.

/// Timeout values in milliseconds
pub mod timeouts {
    /// Default job timeout (5 minutes)
    pub const DEFAULT_JOB_MS: u64 = 300_000;
    /// Database connection timeout
    pub const DB_CONNECT_MS: u64 = 10_000;
}

/// Exit codes for CLI
pub mod exit_codes {
    pub const SUCCESS: i32 = 0;
    pub const FAILURE: i32 = 1;
    pub const CONFIGURATION_ERROR: i32 = 2;
}

/// Log levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum LogLevel {
    Trace,
    Debug,
    #[default]
    Info,
    Warn,
    Error,
}

impl std::str::FromStr for LogLevel {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "trace" => Ok(LogLevel::Trace),
            "debug" => Ok(LogLevel::Debug),
            "info" => Ok(LogLevel::Info),
            "warn" => Ok(LogLevel::Warn),
            "error" => Ok(LogLevel::Error),
            _ => Err(format!("Unknown log level: {}", s)),
        }
    }
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Trace => write!(f, "trace"),
            LogLevel::Debug => write!(f, "debug"),
            LogLevel::Info => write!(f, "info"),
            LogLevel::Warn => write!(f, "warn"),
            LogLevel::Error => write!(f, "error"),
        }
    }
}

/// Application environment
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AppEnv {
    #[default]
    Local,
    Development,
    Staging,
    Production,
    Test,
}

impl std::str::FromStr for AppEnv {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "local" => Ok(AppEnv::Local),
            "development" | "dev" => Ok(AppEnv::Development),
            "staging" => Ok(AppEnv::Staging),
            "production" | "prod" => Ok(AppEnv::Production),
            "test" => Ok(AppEnv::Test),
            _ => Err(format!("Unknown app environment: {}", s)),
        }
    }
}

impl std::fmt::Display for AppEnv {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppEnv::Local => write!(f, "local"),
            AppEnv::Development => write!(f, "development"),
            AppEnv::Staging => write!(f, "staging"),
            AppEnv::Production => write!(f, "production"),
            AppEnv::Test => write!(f, "test"),
        }
    }
}

/// Runner mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum RunnerMode {
    #[default]
    Workflow,
    Cli,
}

impl std::str::FromStr for RunnerMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "workflow" => Ok(RunnerMode::Workflow),
            "cli" => Ok(RunnerMode::Cli),
            _ => Err(format!("Unknown runner mode: {}", s)),
        }
    }
}

impl std::fmt::Display for RunnerMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RunnerMode::Workflow => write!(f, "workflow"),
            RunnerMode::Cli => write!(f, "cli"),
        }
    }
}
