use crate::common;

#[tokio::test]
async fn test_list_microposts_empty() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/microposts", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "success");
    assert!(body["data"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn test_create_micropost() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .post(format!("{}/api/microposts", addr))
        .json(&serde_json::json!({"title": "Test post"}))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 201);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "success");
    assert_eq!(body["data"]["title"], "Test post");
    assert_eq!(body["data"]["id"], 1);
}

#[tokio::test]
async fn test_create_and_list_microposts() {
    let addr = common::spawn_app().await;
    let client = common::client();

    // Create two posts
    client
        .post(format!("{}/api/microposts", addr))
        .json(&serde_json::json!({"title": "First"}))
        .send()
        .await
        .unwrap();
    client
        .post(format!("{}/api/microposts", addr))
        .json(&serde_json::json!({"title": "Second"}))
        .send()
        .await
        .unwrap();

    // List
    let response = client
        .get(format!("{}/api/microposts", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    let data = body["data"].as_array().unwrap();
    assert_eq!(data.len(), 2);
}

#[tokio::test]
async fn test_get_micropost() {
    let addr = common::spawn_app().await;
    let client = common::client();

    // Create first
    client
        .post(format!("{}/api/microposts", addr))
        .json(&serde_json::json!({"title": "Get me"}))
        .send()
        .await
        .unwrap();

    // Get by id
    let response = client
        .get(format!("{}/api/microposts/1", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "success");
    assert_eq!(body["data"]["title"], "Get me");
    assert_eq!(body["data"]["id"], 1);
}

#[tokio::test]
async fn test_get_micropost_not_found() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/api/microposts/999", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 404);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "error");
}

#[tokio::test]
async fn test_create_micropost_invalid_body() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .post(format!("{}/api/microposts", addr))
        .header("Content-Type", "application/json")
        .body("{}")
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 422);
}
