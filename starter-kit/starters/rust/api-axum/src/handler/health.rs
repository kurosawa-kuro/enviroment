use axum::response::IntoResponse;
use serde::Serialize;

use crate::models::response::SuccessResponse;

#[derive(Serialize)]
pub struct HealthData {
    pub status: String,
}

pub async fn health_check() -> impl IntoResponse {
    SuccessResponse(
        "OK".to_string(),
        HealthData {
            status: "healthy".to_string(),
        },
    )
}
