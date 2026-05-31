use reqwest::Client;

pub async fn spawn_app() -> String {
    // Small delay to avoid port conflicts between tests
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let addr = format!("http://127.0.0.1:{}", port);

    let config = starter::config::AppConfig {
        port,
        log_level: "info".to_string(),
        db_path: ":memory:".to_string(),
        static_dir: "client/dist".to_string(),
        server_timeout: 60,
        cors_allow_all: true,
    };

    tokio::spawn(async move {
        let app = starter::router::create_router(&config);
        axum::serve(listener, app).await.unwrap();
    });

    addr
}

pub fn client() -> Client {
    Client::new()
}
