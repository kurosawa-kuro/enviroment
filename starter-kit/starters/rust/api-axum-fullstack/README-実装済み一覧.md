# 実装済み一覧

## アーキテクチャ

```
[Browser] → [Rust :8080] ─┬─ /api/*  → JSON API (Axum)
                           └─ /*      → client/dist/ (SPA fallback)
```

- Rust バックエンドが API と静的ファイル配信を単一ポートで担当
- フロントエンドは React SPA をビルドして `client/dist/` に配置
- Clean Architecture (4層構成) を採用

```
Interface (handler)  →  Application (usecase)  →  Domain (entity + repository trait)
                                                       ↑
                                           Infrastructure (SQLite impl)
```

---

## ディレクトリ構成

```
rust/backend/
├── env/
│   └── config.yaml                         # プロジェクト固有設定 (一元管理)
├── doppler.yaml                            # クレデンシャル管理 (Doppler)
├── Cargo.toml                              # Rust 依存関係
├── Makefile                                # ビルド・開発コマンド
├── src/
│   ├── main.rs                             # エントリポイント
│   ├── lib.rs                              # ライブラリルート
│   ├── config/
│   │   └── mod.rs                          # 設定読み込み (YAML + 環境変数)
│   ├── domain/
│   │   └── micropost/
│   │       ├── entity.rs                   # Micropost 構造体 (フレームワーク非依存)
│   │       └── repository.rs               # MicropostRepository trait
│   ├── application/
│   │   └── micropost/
│   │       ├── dto.rs                      # MicropostOutput, CreateMicropostInput
│   │       └── usecase.rs                  # MicropostUseCase (trait 経由で DB 操作)
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── sqlite_micropost_repository.rs  # MicropostRepository の SQLite 実装
│   ├── interface/
│   │   └── handler/
│   │       ├── health.rs                   # GET /api/health
│   │       ├── micropost.rs                # CRUD ハンドラ (UseCase 経由)
│   │       └── response.rs                 # ApiResponse<T> 統一レスポンス
│   ├── middleware/
│   │   └── error_handler.rs                # 404 fallback
│   └── router/
│       └── mod.rs                          # ルーティング (API + SPA fallback)
├── tests/
│   ├── common/
│   │   └── mod.rs                          # spawn_app(), client() 共通ヘルパー
│   ├── domain.rs                           # domain 層テスト エントリ
│   ├── domain/
│   │   └── micropost.rs                    # Micropost CRUD テスト (6件)
│   ├── interface.rs                        # interface 層テスト エントリ
│   ├── interface/
│   │   ├── handler.rs                      # health + レスポンス形式 (3件)
│   │   ├── middleware.rs                   # 404 + CORS (2件)
│   │   └── spa.rs                          # SPA fallback (3件)
│   └── api.http                            # REST Client 用リクエスト集
├── client/                                 # React フロントエンド
│   ├── index.html                          # SPA シェル (Pico CSS dark)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx                        # エントリ (BrowserRouter)
│       ├── App.tsx                         # ルーティング定義
│       ├── api/client.ts                   # API クライアント (fetch)
│       ├── types/index.ts                  # 型定義
│       ├── components/
│       │   ├── Layout.tsx                  # サイドバー + トップバー + main
│       │   ├── PostTable.tsx               # テーブル表示
│       │   └── EmptyState.tsx              # 空状態
│       ├── pages/
│       │   ├── Home.tsx                    # トップページ
│       │   ├── Microposts.tsx              # 一覧 + 投稿フォーム
│       │   ├── About.tsx                   # 技術スタック
│       │   └── Health.tsx                  # ヘルスチェック
│       └── styles/
│           └── index.css                   # カスタム CSS
└── data/
    └── db.sqlite3                          # SQLite データファイル
```

### Clean Architecture 4層

| 層 | ディレクトリ | 責務 |
|---|---|---|
| **Domain** | `src/domain/` | Entity・Repository trait (フレームワーク非依存) |
| **Application** | `src/application/` | UseCase・DTO (ビジネスロジックの組み立て) |
| **Infrastructure** | `src/infrastructure/` | Repository 実装 (rusqlite) |
| **Interface** | `src/interface/` | HTTP ハンドラ・レスポンス型 (Axum 依存) |

依存方向: `Interface → Application → Domain ← Infrastructure`

---

## API エンドポイント

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/api/health` | ヘルスチェック | 200 |
| GET | `/api/microposts` | Micropost 一覧 | 200 |
| GET | `/api/microposts/{id}` | Micropost 取得 | 200 / 404 |
| POST | `/api/microposts` | Micropost 作成 | 201 / 422 |
| * | `/api/*` (その他) | API 404 | 404 |
| GET | `/*` | SPA fallback (client/dist) | 200 |

### レスポンス形式

```json
// 成功
{ "status": "success", "message": "...", "timestamp": "...", "data": { ... } }

// エラー
{ "status": "error", "message": "...", "timestamp": "...", "error": "not_found" }
```

---

## 設定管理

### env/config.yaml (プロジェクト固有設定)

| キー | 説明 | デフォルト | 環境変数オーバーライド |
|-----|------|----------|---------------------|
| `port` | サーバーポート | 8080 | `PORT` |
| `logLevel` | ログレベル | info | `RUST_LOG` |
| `db.path` | SQLite パス | data/db.sqlite3 | `DB_PATH` |
| `static.dir` | SPA 配信ディレクトリ | client/dist | `STATIC_DIR` |
| `server.timeout` | リクエストタイムアウト (秒) | 60 | `SERVER_TIMEOUT` |
| `server.corsAllowAll` | CORS 全許可 | true | `CORS_ALLOW_ALL` |

**優先順位**: 環境変数 > config.yaml > デフォルト値

### doppler.yaml (クレデンシャル)

クレデンシャルは Doppler で管理。`doppler run -- cargo run` で注入。

---

## 技術スタック

### バックエンド

| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| axum | 0.8 | Web フレームワーク |
| tokio | 1 | 非同期ランタイム |
| tower-http | 0.6 | CORS, トレース, タイムアウト, 静的ファイル配信 |
| rusqlite | 0.31 | SQLite (bundled) |
| serde / serde_json | 1 | シリアライズ |
| serde_yaml | 0.9 | config.yaml パース |
| chrono | 0.4 | タイムスタンプ |
| tracing | 0.1 | 構造化ログ |

### フロントエンド

| ライブラリ | 用途 |
|-----------|------|
| React 18 | UI |
| TypeScript 5 | 型安全 |
| React Router v6 | SPA ルーティング |
| Vite 6 | ビルド |
| Pico CSS v2 | CSS フレームワーク (dark テーマ固定) |

---

## フロントエンド ページ構成

| ルート | コンポーネント | 内容 |
|--------|------------|------|
| `/` | Home | ようこそ + API エンドポイント一覧 |
| `/microposts` | Microposts | 投稿フォーム + 一覧テーブル |
| `/about` | About | 使用技術 |
| `/health` | Health | API ヘルスチェック結果表示 |

### UI パターン

- **レイアウト**: template-admin 準拠のサイドバー + トップバー
- **テーマ**: Pico CSS ダークテーマ固定
- **アクセント**: Violet (#8b5cf6)
- **レスポンシブ**: モバイル時ハンバーガーメニュー

---

## テスト (14件)

テストは Clean Architecture の層に対応したディレクトリ構成で管理。

### domain::micropost (6件)

| テスト名 | 内容 |
|---------|------|
| `test_list_microposts_empty` | GET /api/microposts → 空配列 |
| `test_create_micropost` | POST → 201, id=1 |
| `test_create_and_list_microposts` | 2件作成 → 一覧で件数確認 |
| `test_get_micropost` | 作成後 GET → 200 |
| `test_get_micropost_not_found` | 存在しない ID → 404 |
| `test_create_micropost_invalid_body` | 空 JSON → 422 |

### interface::handler (3件)

| テスト名 | 内容 |
|---------|------|
| `test_health_check` | GET /api/health → 200, status=success |
| `test_success_response_format` | 成功レスポンスのフィールド検証 |
| `test_error_response_format` | エラーレスポンスのフィールド検証 |

### interface::middleware (2件)

| テスト名 | 内容 |
|---------|------|
| `test_api_not_found` | GET /api/nonexistent → 404, error=not_found |
| `test_cors_headers` | CORS ヘッダー確認 |

### interface::spa (3件)

| テスト名 | 内容 |
|---------|------|
| `test_spa_root_serves_index_html` | GET / → index.html 配信 |
| `test_spa_fallback_unknown_route` | GET /about → SPA fallback |
| `test_spa_fallback_deep_path` | GET /microposts → SPA fallback |

---

## Makefile コマンド

| コマンド | 説明 |
|---------|------|
| `make setup` | DB初期化 + フロントビルド + Rustビルド |
| `make run` | サーバー起動 (設定は config.yaml) |
| `make dev` | ホットリロード (cargo-watch) |
| `make test` | テスト実行 (14件) |
| `make build` | Rust ビルド |
| `make build-prod` | リリースビルド |
| `make frontend-install` | npm install |
| `make frontend-build` | Vite ビルド |
| `make db-setup` | SQLite テーブル作成 |
| `make db-reset` | DB リセット |
| `make db-seed` | サンプルデータ投入 |
| `make fmt` | コードフォーマット |
| `make lint` | Clippy |
| `make clean` | ビルド成果物削除 |
