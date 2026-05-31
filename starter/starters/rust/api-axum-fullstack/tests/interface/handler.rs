use crate::common;

// ==================== Health ====================

#[tokio::test]
async fn test_health_check() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/health", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "success");
    assert_eq!(body["data"]["status"], "healthy");
}

// ==================== Response Format ====================

#[tokio::test]
async fn test_success_response_format() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/health", addr))
        .send()
        .await
        .unwrap();

    let body: serde_json::Value = response.json().await.unwrap();

    // All success responses must have these fields
    assert_eq!(body["status"], "success");
    assert!(body["message"].is_string());
    assert!(body["timestamp"].is_string());
    assert!(!body["data"].is_null());
    // error field should be absent
    assert!(body.get("error").is_none() || body["error"].is_null());
}

#[tokio::test]
async fn test_error_response_format() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/nonexistent", addr))
        .send()
        .await
        .unwrap();

    let body: serde_json::Value = response.json().await.unwrap();

    // All error responses must have these fields
    assert_eq!(body["status"], "error");
    assert!(body["message"].is_string());
    assert!(body["timestamp"].is_string());
    assert!(body["error"].is_string());
    // data field should be absent
    assert!(body.get("data").is_none() || body["data"].is_null());
}
