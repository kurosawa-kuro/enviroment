# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Full setup (DB + frontend + Rust build)
make setup

# Build
make build              # debug
make build-prod         # release

# Run
make run                # cargo run (port 8080)
make dev                # cargo watch with hot reload

# Test
make test               # Rust tests (--test-threads=1)
make e2e                # Playwright E2E (builds frontend + binary first)
make e2e-headed         # E2E with visible browser

# Single test
cargo test test_health_check -- --test-threads=1
cargo test domain::micropost -- --test-threads=1

# Code quality
make fmt                # cargo fmt
make lint               # cargo clippy -- -D warnings

# Database
make db-setup           # create SQLite table
make db-reset           # drop and recreate
make db-seed            # insert sample data

# Frontend
make frontend-build     # tsc && vite build → client/dist/
```

## Architecture

Clean Architecture with 4 layers. Dependencies point inward: infrastructure/interface → application → domain.

**Domain** (`src/domain/micropost/`) — Entity and repository trait. `MicropostRepository` is a synchronous trait requiring `Send + Sync`.

**Application** (`src/application/micropost/`) — `MicropostUseCase` holds `Arc<dyn MicropostRepository>`. Converts domain entities to DTOs via `Into<T>`.

**Infrastructure** (`src/infrastructure/persistence/`) — `SqliteMicropostRepository` wraps `Mutex<Connection>`. Auto-creates the `microposts` table on `new()`. Supports `:memory:` for tests.

**Interface** (`src/interface/handler/`) — Axum handlers extract `State<Arc<MicropostUseCase>>`. Return `SuccessResponse<T>` or `ErrorResponse` which implement `IntoResponse`.

### Dependency Injection Flow

```
main.rs
  → SqliteMicropostRepository::new(db_path) wrapped in Arc
  → MicropostUseCase::new(repo) wrapped in Arc
  → create_router(config) receives usecase as Axum State
  → handlers extract State<AppState> (= Arc<MicropostUseCase>)
```

### Response Format

All API responses use `ApiResponse<T>` with fields: `status`, `message`, `timestamp`, `data` (success) or `error` (failure). Null fields are skipped via `skip_serializing_if`.

### Configuration

`AppConfig::load()` reads `env/config.yaml`, then environment variables override, then defaultsdefaults. Key env vars: `PORT` (8080), `DB_PATH` (data/db.sqlite3), `STATIC_DIR` (client/dist), `RUST_LOG` (info), `SERVER_TIMEOUT` (60), `CORS_ALLOW_ALL` (true).

### Router

Routes: `GET /api/health`, `GET /api/microposts`, `POST /api/microposts`, `GET /api/microposts/{id}`. Unknown `/api/*` returns JSON 404. All other paths fall back to `client/dist/index.html` (SPA).

Middleware stack: CORS → Timeout → TraceLayer.

### Tests

- **Rust integration tests** (`tests/`) — Spawn full app on random port with in-memory SQLite, use `reqwest` for HTTP assertions. Organized as `tests/domain.rs` and `tests/interface.rs` with submodules.
- **E2E** (`e2e/`) — Playwright (TypeScript). Worker-scoped fixture in `e2e/fixtures/server.ts` builds and spawns the actual binary with `:memory:` DB. 11 tests covering API, UI form interaction, and SPA fallback.

### Frontend

React 18 + TypeScript + Vite SPA in `client/`. Uses React Router for client-side routing. Built output served by Axum's `ServeDir` with `index.html` fallback.

## Design Guidelines

- **検証依頼は必ず実行する**: ユーザーから `make test`、`make e2e`、ビルド確認などの検証を依頼された場合、省略せず実際にコマンドを実行して結果を確認すること。
- **ブラウザレベルの検証も省略しない**: データ反映の確認など、ブラウザレベルでの検証を依頼された場合も無視せず、Playwright や E2E テストを使って実際に画面上の表示・動作を検証すること。
- **クレデンシャルは Doppler で管理**: `.env` ファイルにシークレットを置かない。API キー・トークン等のクレデンシャルは原則 Doppler を使って管理し、`doppler run --` 経由で環境変数として注入すること。
- **OpenAI API 利用時のトークン節約**: LLM API を呼び出す機能を実装する場合、トークン消費が過大にならない設計を心がけること。具体的には、プロンプトを簡潔に保つ、不要なコンテキストを送らない、レスポンスの `max_tokens` を適切に制限する、ストリーミングで早期打ち切りを検討する、キャッシュ可能な結果はキャッシュする。
