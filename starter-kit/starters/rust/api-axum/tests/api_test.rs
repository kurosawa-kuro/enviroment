use reqwest::Client;

async fn spawn_app() -> String {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let addr = format!("http://127.0.0.1:{}", port);

    tokio::spawn(async move {
        let app = hello_world_api::router::create_router();
        axum::serve(listener, app).await.unwrap();
    });

    addr
}

#[tokio::test]
async fn test_health_check() {
    let addr = spawn_app().await;
    let client = Client::new();

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

#[tokio::test]
async fn test_hello_world() {
    let addr = spawn_app().await;
    let client = Client::new();

    let response = client
        .get(format!("{}/api/hello", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "success");
    assert_eq!(body["data"]["message"], "Hello, World!");
}

#[tokio::test]
async fn test_greet() {
    let addr = spawn_app().await;
    let client = Client::new();

    let response = client
        .get(format!("{}/api/hello/Rust", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 200);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "success");
    assert_eq!(body["data"]["message"], "Hello, Rust!");
    assert_eq!(body["data"]["name"], "Rust");
}

#[tokio::test]
async fn test_not_found() {
    let addr = spawn_app().await;
    let client = Client::new();

    let response = client
        .get(format!("{}/nonexistent", addr))
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), 404);

    let body: serde_json::Value = response.json().await.unwrap();
    assert_eq!(body["status"], "error");
}
