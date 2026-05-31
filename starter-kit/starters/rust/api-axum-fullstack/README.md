# Rust Backend — Axum + React SPA

Micropost CRUD アプリケーション。Rust (Axum) バックエンドと React (Vite) フロントエンドを単一バイナリで配信する。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Web フレームワーク | Axum 0.8 |
| 非同期ランタイム | Tokio |
| データベース | SQLite (rusqlite) |
| フロントエンド | React 18 + TypeScript + Vite |
| ルーティング (SPA) | React Router DOM 6 |
| E2E テスト | Playwright |

## 機能

- **Micropost CRUD API** — 投稿の作成・一覧・個別取得
- **ヘルスチェック** — `GET /api/health`
- **SPA 配信** — `client/dist` の静的ファイルを配信し、未知のパスは `index.html` にフォールバック
- **CORS / タイムアウト / リクエストトレーシング** — Tower-HTTP ミドルウェア

## API エンドポイント

| メソッド | パス | 説明 | ステータス |
|---------|------|------|-----------|
| GET | `/api/health` | ヘルスチェック | 200 |
| GET | `/api/microposts` | 投稿一覧 | 200 |
| GET | `/api/microposts/{id}` | 投稿取得 | 200 / 404 |
| POST | `/api/microposts` | 投稿作成 (`{ "title": "..." }`) | 201 |

レスポンス共通形式:

```json
{
  "status": "success",
  "message": "...",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": { "id": 1, "title": "Hello" }
}
```

## ディレクトリ構成

```
src/
├── config/          # 設定管理 (YAML + 環境変数)
├── domain/          # エンティティ・リポジトリトレイト
├── application/     # ユースケース・DTO
├── interface/       # HTTP ハンドラ・レスポンス構造体
├── infrastructure/  # SQLite リポジトリ実装
├── middleware/      # エラーハンドリング
├── router/          # ルーティング定義
├── main.rs          # エントリーポイント
└── lib.rs
client/              # React フロントエンド (Vite)
e2e/                 # Playwright E2E テスト
tests/               # Rust 統合テスト
env/                 # 設定ファイル (config.yaml)
```

## 環境構築

### 前提条件

- Rust (stable)
- Node.js (v18+)
- SQLite3 CLI

### セットアップ

```bash
make setup
```

これは以下を順に実行する:

1. `db-setup` — SQLite データベース初期化
2. `frontend-install` — フロントエンド依存関係インストール
3. `frontend-build` — フロントエンドビルド (`client/dist` 生成)
4. `build` — Rust バイナリビルド

### 設定

`env/config.yaml` で設定を管理する。環境変数でオーバーライド可能。

`env/config.yaml` は公開してよい一般設定だけにする。秘密情報が必要になったら `env/secret.yaml` や `.env` を使い、コミットしない。

| 環境変数 | デフォルト | 説明 |
|---------|-----------|------|
| `PORT` | 8080 | サーバーポート |
| `DB_PATH` | data/db.sqlite3 | SQLite ファイルパス |
| `STATIC_DIR` | client/dist | 静的ファイルディレクトリ |
| `RUST_LOG` | info | ログレベル |
| `SERVER_TIMEOUT` | 60 | タイムアウト (秒) |
| `CORS_ALLOW_ALL` | true | CORS 全許可 |

## 起動

```bash
# 通常起動
make run

# ホットリロード (cargo-watch 必要)
make dev
```

`http://localhost:8080` でアクセス可能。

## Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

停止:

```bash
docker compose -f docker/docker-compose.yml down
```

## テスト

```bash
# Rust ユニット / 統合テスト (14 テスト)
make test

# E2E テスト — Playwright (11 テスト)
make e2e

# E2E テスト — ブラウザ表示あり
make e2e-headed

# E2E レポート表示
make e2e-report
```

## Make ターゲット一覧

| ターゲット | 説明 |
|-----------|------|
| `setup` | 初期セットアップ (DB + フロント + ビルド) |
| `build` | デバッグビルド |
| `build-prod` | リリースビルド |
| `run` | サーバー起動 |
| `dev` | ホットリロード起動 |
| `test` | Rust テスト実行 |
| `test-coverage` | カバレッジレポート生成 |
| `e2e` | E2E テスト実行 |
| `e2e-headed` | E2E テスト (ブラウザ表示) |
| `e2e-report` | E2E レポート表示 |
| `fmt` | コードフォーマット |
| `lint` | Clippy リント |
| `db-setup` | DB 初期化 |
| `db-reset` | DB リセット |
| `db-seed` | サンプルデータ投入 |
| `clean` | ビルド成果物削除 |
