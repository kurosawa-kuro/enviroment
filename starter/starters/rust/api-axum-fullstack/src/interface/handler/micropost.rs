use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;

use crate::application::micropost::dto::CreateMicropostInput;
use crate::application::micropost::usecase::MicropostUseCase;

use super::response::{ApiResponse, ErrorResponse, SuccessResponse};

pub type AppState = Arc<MicropostUseCase>;

pub async fn list(State(uc): State<AppState>) -> impl IntoResponse {
    let microposts = uc.list();
    SuccessResponse("Microposts retrieved successfully".to_string(), microposts)
}

pub async fn get_by_id(State(uc): State<AppState>, Path(id): Path<i64>) -> impl IntoResponse {
    match uc.find_by_id(id) {
        Some(micropost) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                "Micropost retrieved successfully",
                micropost,
            )),
        )
            .into_response(),
        None => ErrorResponse(
            StatusCode::NOT_FOUND,
            "not_found".to_string(),
            format!("Micropost with id {} not found", id),
        )
        .into_response(),
    }
}

pub async fn create(
    State(uc): State<AppState>,
    Json(body): Json<CreateMicropostInput>,
) -> impl IntoResponse {
    let micropost = uc.create(body);
    (
        StatusCode::CREATED,
        Json(ApiResponse::success(
            "Micropost created successfully",
            micropost,
        )),
    )
}
