use crate::common;

// ==================== Error Handler ====================

#[tokio::test]
async fn test_api_not_found() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/nonexistent", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 404);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "error");
    assert_eq!(body["error"], "not_found");
}

// ==================== CORS ====================

#[tokio::test]
async fn test_cors_headers() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/health", addr))
        .header("Origin", "http://example.com")
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);
    assert!(response
        .headers()
        .contains_key("access-control-allow-origin"));
}
