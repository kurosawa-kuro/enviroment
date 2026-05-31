use axum::http::StatusCode;
use axum::response::{IntoResponse, Json, Response};
use chrono::Utc;
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(message: impl Into<String>, data: T) -> Self {
        Self {
            status: "success".to_string(),
            message: Some(message.into()),
            timestamp: Utc::now().to_rfc3339(),
            data: Some(data),
            error: None,
        }
    }
}

impl ApiResponse<()> {
    pub fn error(error_type: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            status: "error".to_string(),
            message: Some(message.into()),
            timestamp: Utc::now().to_rfc3339(),
            data: None,
            error: Some(error_type.into()),
        }
    }
}

pub struct SuccessResponse<T: Serialize>(pub String, pub T);

impl<T: Serialize> IntoResponse for SuccessResponse<T> {
    fn into_response(self) -> Response {
        let body = ApiResponse::success(self.0, self.1);
        (StatusCode::OK, Json(body)).into_response()
    }
}

pub struct ErrorResponse(pub StatusCode, pub String, pub String);

impl IntoResponse for ErrorResponse {
    fn into_response(self) -> Response {
        let body = ApiResponse::<()>::error(self.1, self.2);
        (self.0, Json(body)).into_response()
    }
}
