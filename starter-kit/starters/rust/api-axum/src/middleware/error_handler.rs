use axum::http::StatusCode;
use axum::response::IntoResponse;

use crate::models::response::ErrorResponse;

pub async fn not_found() -> impl IntoResponse {
    ErrorResponse(
        StatusCode::NOT_FOUND,
        "not_found".to_string(),
        "The requested resource was not found".to_string(),
    )
}
