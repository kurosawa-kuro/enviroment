use std::env;

pub struct AppConfig {
    pub port: u16,
}

impl AppConfig {
    pub fn load() -> Self {
        Self {
            port: env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(8080),
        }
    }
}
