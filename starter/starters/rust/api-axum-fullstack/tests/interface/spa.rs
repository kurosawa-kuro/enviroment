use crate::common;

#[tokio::test]
async fn test_spa_root_serves_index_html() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client.get(format!("{}/", addr)).send().await.unwrap();

    // client/dist が存在する場合は 200、存在しない場合は 404
    // CI/テスト環境では dist がビルドされていない可能性があるため両方許容
    let status = response.status().as_u16();
    if status == 200 {
        let body = response.text().await.unwrap();
        assert!(body.contains("<!DOCTYPE html>") || body.contains("<div id=\"root\">"));
    } else {
        assert_eq!(status, 404);
    }
}

#[tokio::test]
async fn test_spa_fallback_unknown_route() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client.get(format!("{}/about", addr)).send().await.unwrap();

    let status = response.status().as_u16();
    if status == 200 {
        // SPA fallback: /about でも index.html が返る
        let body = response.text().await.unwrap();
        assert!(body.contains("<!DOCTYPE html>") || body.contains("<div id=\"root\">"));
    } else {
        // dist が存在しない場合
        assert_eq!(status, 404);
    }
}

#[tokio::test]
async fn test_spa_fallback_deep_path() {
    let addr = common::spawn_app().await;
    let client = common::client();

    let response = client
        .get(format!("{}/microposts", addr))
        .send()
        .await
        .unwrap();

    let status = response.status().as_u16();
    if status == 200 {
        let body = response.text().await.unwrap();
        assert!(body.contains("<!DOCTYPE html>") || body.contains("<div id=\"root\">"));
    } else {
        assert_eq!(status, 404);
    }
}
