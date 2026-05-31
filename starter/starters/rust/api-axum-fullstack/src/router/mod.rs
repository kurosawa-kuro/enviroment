use std::sync::Arc;
use std::time::Duration;

use axum::http::StatusCode;
use axum::routing::get;
use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use crate::application::micropost::usecase::MicropostUseCase;
use crate::config::AppConfig;
use crate::infrastructure::persistence::sqlite_micropost_repository::SqliteMicropostRepository;
use crate::interface::handler::{health, micropost};
use crate::middleware::error_handler;

pub fn create_router(config: &AppConfig) -> Router {
    let cors = if config.cors_allow_all {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    } else {
        CorsLayer::new()
    };

    // Ensure data directory exists
    if let Some(parent) = std::path::Path::new(&config.db_path).parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let repo = Arc::new(SqliteMicropostRepository::new(&config.db_path));
    let usecase: micropost::AppState = Arc::new(MicropostUseCase::new(repo));

    let api_routes = Router::new()
        .route("/health", get(health::health_check))
        .route("/microposts", get(micropost::list).post(micropost::create))
        .route("/microposts/{id}", get(micropost::get_by_id))
        .fallback(error_handler::not_found)
        .with_state(usecase);

    let index_path = format!("{}/index.html", config.static_dir);
    let spa = ServeDir::new(&config.static_dir).fallback(ServeFile::new(&index_path));

    Router::new()
        .nest("/api", api_routes)
        .fallback_service(spa)
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(config.server_timeout),
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
