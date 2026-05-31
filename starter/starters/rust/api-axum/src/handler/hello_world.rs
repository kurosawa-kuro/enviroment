use axum::extract::Path;
use axum::response::IntoResponse;

use crate::models::response::SuccessResponse;
use crate::services::hello_world_service;

pub async fn get_hello_world() -> impl IntoResponse {
    let data = hello_world_service::get_hello_world();
    SuccessResponse("Hello World retrieved successfully".to_string(), data)
}

pub async fn greet(Path(name): Path<String>) -> impl IntoResponse {
    let data = hello_world_service::greet(&name);
    SuccessResponse(format!("Greeting for {}", name), data)
}
