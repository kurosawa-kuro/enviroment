mod application;
mod config;
mod domain;
mod infrastructure;
mod interface;
mod middleware;
mod router;

use config::AppConfig;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    let config = AppConfig::load();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| config.log_level.clone().into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let addr = format!("0.0.0.0:{}", config.port);

    let app = router::create_router(&config);

    tracing::info!("Database: {}", config.db_path);
    tracing::info!("Static dir: {}", config.static_dir);
    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install CTRL+C signal handler");
    tracing::info!("Shutting down gracefully...");
}
