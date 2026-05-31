//! YAML Configuration Loader
//!
//! Loads configuration from YAML file with environment variable overrides.
//!
//! Priority (highest to lowest):
//!   1. Environment variables
//!   2. env/config.yaml
//!   3. Default values

use std::env;
use std::fs;
use std::path::Path;
use std::sync::OnceLock;

use serde::Deserialize;
use tracing::warn;

use crate::interfaces::{AppConfig, ConfigProvider};

/// Raw configuration from YAML file
#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct YamlConfig {
    #[serde(default)]
    project_name: Option<String>,
    #[serde(default)]
    app_env: Option<String>,
    #[serde(default)]
    runner_mode: Option<String>,
    #[serde(default)]
    log_level: Option<String>,
    #[serde(default)]
    db_path: Option<String>,
}

/// Global cached configuration
static CONFIG: OnceLock<AppConfig> = OnceLock::new();

/// Load configuration from YAML file
fn load_yaml_config(config_path: &Path) -> YamlConfig {
    if !config_path.exists() {
        warn!("Config file not found: {:?}, using defaults", config_path);
        return YamlConfig::default();
    }

    match fs::read_to_string(config_path) {
        Ok(content) => match serde_yaml::from_str(&content) {
            Ok(config) => config,
            Err(e) => {
                warn!("Failed to parse config.yaml: {}, using defaults", e);
                YamlConfig::default()
            }
        },
        Err(e) => {
            warn!("Failed to read config.yaml: {}, using defaults", e);
            YamlConfig::default()
        }
    }
}

/// Load environment variable overrides
fn load_env_overrides(config: &mut AppConfig) {
    if let Ok(val) = env::var("PROJECT_NAME") {
        config.project_name = val;
    }
    if let Ok(val) = env::var("APP_ENV") {
        if let Ok(env) = val.parse() {
            config.app_env = env;
        }
    }
    if let Ok(val) = env::var("RUNNER_MODE") {
        if let Ok(mode) = val.parse() {
            config.runner_mode = mode;
        }
    }
    if let Ok(val) = env::var("LOG_LEVEL") {
        if let Ok(level) = val.parse() {
            config.log_level = level;
        }
    }
    if let Ok(val) = env::var("DB_PATH") {
        config.db_path = val;
    }
    if let Ok(val) = env::var("DATABASE_URL") {
        config.database_url = Some(val);
    }
    if let Ok(val) = env::var("API_KEY") {
        config.api_key = Some(val);
    }
}

/// Initialize configuration
///
/// Loads from YAML and applies environment variable overrides.
pub fn init_config() -> AppConfig {
    init_config_with_path(Path::new("env/config.yaml"))
}

/// Initialize configuration with custom path
pub fn init_config_with_path(config_path: &Path) -> AppConfig {
    let yaml = load_yaml_config(config_path);

    let mut config = AppConfig {
        project_name: yaml.project_name.unwrap_or_else(|| "batch".to_string()),
        app_env: yaml
            .app_env
            .and_then(|s| s.parse().ok())
            .unwrap_or_default(),
        runner_mode: yaml
            .runner_mode
            .and_then(|s| s.parse().ok())
            .unwrap_or_default(),
        log_level: yaml
            .log_level
            .and_then(|s| s.parse().ok())
            .unwrap_or_default(),
        db_path: yaml.db_path.unwrap_or_else(|| "data/batch.db".to_string()),
        database_url: None,
        api_key: None,
    };

    load_env_overrides(&mut config);

    config
}

/// Get the current configuration (initializes if not already done)
pub fn get_config() -> &'static AppConfig {
    CONFIG.get_or_init(init_config)
}

/// Reset configuration (useful for testing)
///
/// Note: This only works if the config hasn't been initialized yet.
/// For tests, use `init_config_with_path` directly.
pub fn reset_config() {
    // OnceLock doesn't support reset, so we can't truly reset
    // In tests, create fresh configs using init_config_with_path
}

/// Configuration provider using the global config
pub struct YamlConfigProvider {
    config: AppConfig,
}

impl YamlConfigProvider {
    pub fn new() -> Self {
        Self {
            config: init_config(),
        }
    }

    pub fn with_config(config: AppConfig) -> Self {
        Self { config }
    }
}

impl Default for YamlConfigProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl ConfigProvider for YamlConfigProvider {
    fn get(&self) -> &AppConfig {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::constants::{AppEnv, LogLevel};
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_load_yaml_config() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(
            file,
            r#"
projectName: test-project
appEnv: development
logLevel: debug
dbPath: test.db
"#
        )
        .unwrap();

        let config = init_config_with_path(file.path());
        assert_eq!(config.project_name, "test-project");
        assert_eq!(config.app_env, AppEnv::Development);
        assert_eq!(config.log_level, LogLevel::Debug);
        assert_eq!(config.db_path, "test.db");
    }

    #[test]
    fn test_default_config() {
        let config = init_config_with_path(Path::new("/nonexistent/config.yaml"));
        assert_eq!(config.project_name, "batch");
        assert_eq!(config.db_path, "data/batch.db");
    }
}
