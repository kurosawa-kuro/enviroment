use std::env;
use std::fs;

use serde::Deserialize;

const CONFIG_PATH: &str = "env/config.yaml";

/// config.yaml の構造
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ConfigFile {
    port: Option<u16>,
    log_level: Option<String>,
    db: Option<DbConfig>,
    #[serde(rename = "static")]
    static_: Option<StaticConfig>,
    server: Option<ServerConfig>,
}

#[derive(Deserialize, Default)]
struct DbConfig {
    path: Option<String>,
}

#[derive(Deserialize, Default)]
struct StaticConfig {
    dir: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ServerConfig {
    timeout: Option<u64>,
    cors_allow_all: Option<bool>,
}

/// アプリケーション設定
/// config.yaml を読み込み、環境変数でオーバーライド
pub struct AppConfig {
    pub port: u16,
    pub log_level: String,
    pub db_path: String,
    pub static_dir: String,
    pub server_timeout: u64,
    pub cors_allow_all: bool,
}

impl AppConfig {
    pub fn load() -> Self {
        let file = Self::load_file();

        Self {
            port: env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .or(file.port)
                .unwrap_or(8080),

            log_level: env::var("RUST_LOG")
                .ok()
                .or(file.log_level)
                .unwrap_or_else(|| "info".to_string()),

            db_path: env::var("DB_PATH")
                .ok()
                .or(file.db.as_ref().and_then(|d| d.path.clone()))
                .unwrap_or_else(|| "data/db.sqlite3".to_string()),

            static_dir: env::var("STATIC_DIR")
                .ok()
                .or(file.static_.as_ref().and_then(|s| s.dir.clone()))
                .unwrap_or_else(|| "client/dist".to_string()),

            server_timeout: env::var("SERVER_TIMEOUT")
                .ok()
                .and_then(|v| v.parse().ok())
                .or(file.server.as_ref().and_then(|s| s.timeout))
                .unwrap_or(60),

            cors_allow_all: env::var("CORS_ALLOW_ALL")
                .ok()
                .map(|v| v == "true" || v == "1")
                .or(file.server.as_ref().and_then(|s| s.cors_allow_all))
                .unwrap_or(true),
        }
    }

    fn load_file() -> ConfigFile {
        fs::read_to_string(CONFIG_PATH)
            .ok()
            .and_then(|content| serde_yaml::from_str(&content).ok())
            .unwrap_or_default()
    }
}
