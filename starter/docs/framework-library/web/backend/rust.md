# Rust Web API Blueprint

Rust で Web API を作る時の公開用ブループリント。

この starter-kit では、通常 API は `starters/rust/api-axum`、フルスタック寄りの構成は `starters/rust/api-axum-fullstack` を正典にする。Rust は「速いから採用」ではなく、型で境界を固定し、長期運用で壊れにくい API を作るために採用する。

## 採用する場面

- API の入力・出力・エラーを型で強く固定したい。
- バッチ、CLI、API を同じ言語・同じドメイン型で揃えたい。
- Cloud Run / container / VM などに小さい単一バイナリで載せたい。
- レイテンシ、メモリ使用量、起動時間を抑えたい。

短期の CRUD API や管理画面付きの小規模アプリなら、まず [fastapi.md](./fastapi.md) も検討する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Rust stable |
| Runtime | Tokio |
| Framework | axum 0.8 系 |
| Serialization | serde / serde_json |
| Validation | validator または request DTO の constructor |
| Error | thiserror / anyhow |
| Logging | tracing / tracing-subscriber |
| Test | cargo test + tower::ServiceExt |
| Config | environment variables / config files without secrets |

## ディレクトリ

```text
src/
  main.rs        # 起動、listener、graceful shutdown
  lib.rs         # app factory / route mount
  config.rs      # env parsing
  error.rs       # API error mapping
  routes/
    health.rs
    items.rs
  domain/
    item.rs
  services/
    item_service.rs
tests/
  api_test.rs
config/
env/
  config.yaml
docker/
  Dockerfile
```

## API 契約

- `GET /healthz`: process health。
- `GET /readyz`: DB や外部依存を含む readiness。外部依存がない場合は省略可。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。

成功レスポンス:

```json
{
  "data": {},
  "error": null
}
```

エラーレスポンス:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

## 実装ルール

- `main.rs` は起動だけ、`lib.rs` は app 構築だけに分ける。
- handler には request / response 変換だけを置き、ビジネスロジックは service に寄せる。
- `unwrap()` / `expect()` は起動時の必須設定に限定する。リクエスト処理中は typed error に変換する。
- `State` には secret 値を直接持たせず、必要なら secret manager や runtime env から注入する。
- DB URL、token、webhook URL の実値を `config/` や README に書かない。
- OpenAPI は外部公開 API の契約が必要な場合だけ追加する。

## スターター対応

| スターター | 用途 |
|---|---|
| `starters/rust/api-axum` | 通常 API の第一候補 |
| `starters/rust/api-axum-fullstack` | API + frontend + DB の構成例 |
| `starters/rust/batch` | API ではなく batch / job registry の構成例 |
| `starters/rust/cli` | CLI ツールの構成例 |

## Makefile 例

```makefile
.PHONY: build run test fmt lint clean

build:
	cargo build

run:
	cargo run

test:
	cargo test

fmt:
	cargo fmt

lint:
	cargo clippy --all-targets -- -D warnings

clean:
	cargo clean
```
