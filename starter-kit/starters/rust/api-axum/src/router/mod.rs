use std::time::Duration;

use axum::http::StatusCode;
use axum::routing::get;
use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use crate::handler::{health, hello_world};
use crate::middleware::error_handler;

pub fn create_router() -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .route("/health", get(health::health_check))
        .route("/hello", get(hello_world::get_hello_world))
        .route("/hello/{name}", get(hello_world::greet));

    Router::new()
        .nest("/api", api_routes)
        .fallback(error_handler::not_found)
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(60),
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
