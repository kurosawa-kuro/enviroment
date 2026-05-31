//! Config Port - Configuration provider interface
//!
//! Abstracts configuration access for testability.

use crate::shared::constants::{AppEnv, LogLevel, RunnerMode};

/// Application configuration
///
/// - Project settings: from config.yaml
/// - Credentials: from environment variables
#[derive(Debug, Clone)]
pub struct AppConfig {
    /// Project name
    pub project_name: String,
    /// Application environment
    pub app_env: AppEnv,
    /// Runner mode (workflow or cli)
    pub runner_mode: RunnerMode,
    /// Logging level
    pub log_level: LogLevel,
    /// SQLite database path (relative to project root)
    pub db_path: String,
    /// Database URL (optional - for external DB connections)
    pub database_url: Option<String>,
    /// API Key (optional - for external API calls)
    pub api_key: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            project_name: "batch".to_string(),
            app_env: AppEnv::Local,
            runner_mode: RunnerMode::Workflow,
            log_level: LogLevel::Info,
            db_path: "data/batch.db".to_string(),
            database_url: None,
            api_key: None,
        }
    }
}

/// Configuration provider interface
pub trait ConfigProvider: Send + Sync {
    /// Get current configuration
    fn get(&self) -> &AppConfig;
}
