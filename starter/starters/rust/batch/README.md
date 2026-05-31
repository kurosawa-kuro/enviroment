# Rust Batch

Rust製バッチジョブ実行・ワークフローランナー

## 必要環境

- Rust 1.70+
- Cargo

## クイックスタート

```bash
# ビルド
make build

# 全ジョブを順次実行
make run

# ジョブ一覧表示
make list
```

## ビルド

```bash
# デバッグビルド
make build

# リリースビルド（最適化）
make release

# クリーンビルド
make clean && make build
```

## 起動・実行

### ワークフロー実行（全ジョブ順次）

```bash
make run
# または
cargo run
```

### 単一ジョブ実行

```bash
# hello-world ジョブ
make hello-world

# データベース初期化
make db-init

# CRUD デモ
make item-crud
```

### CLI オプション

```bash
# 特定ジョブを実行
cargo run -- --job <ジョブ名>

# ジョブ一覧
cargo run -- --list

# ヘルプ
cargo run -- --help
```

## 登録済みジョブ

| ジョブ名 | 説明 |
|---------|------|
| `hello-world` | 動作確認用サンプル |
| `db-init` | データベース初期化・マイグレーション |
| `item-crud` | CRUD操作デモ |

## 設定

### 設定ファイル

`env/config.yaml`:

```yaml
projectName: rust-batch
appEnv: local          # local/development/staging/production
logLevel: debug        # trace/debug/info/warn/error
dbPath: data/batch.db
runnerMode: workflow   # workflow/cli
```

### 環境変数オーバーライド

環境変数で設定を上書き可能（優先順位: 環境変数 > config.yaml）:

```bash
APP_ENV=production LOG_LEVEL=info cargo run
```

| 環境変数 | 対応設定 |
|---------|---------|
| `PROJECT_NAME` | projectName |
| `APP_ENV` | appEnv |
| `LOG_LEVEL` | logLevel |
| `DB_PATH` | dbPath |
| `RUNNER_MODE` | runnerMode |

`env/config.yaml` は公開してよい一般設定だけにする。`DATABASE_URL`、`API_KEY` などの秘密情報は環境変数または `env/secret.yaml` に置き、コミットしない。

## テスト

```bash
# 全テスト実行
make test

# 詳細出力
make test-verbose
```

## 開発

```bash
# フォーマット
make fmt

# Linter
make clippy

# フォーマット + Linter
make check
```

## ディレクトリ構成

```
src/
├── main.rs           # エントリーポイント
├── lib.rs            # ライブラリエクスポート
├── shared/           # 共通ユーティリティ
├── interfaces/       # トレイト定義
├── infrastructure/   # インフラ実装（DB、設定）
├── domain/           # ドメイン層
├── application/      # ジョブ定義
├── registry/         # ジョブレジストリ
├── runner/           # ワークフローランナー
└── di/               # 依存性注入

env/
└── config.yaml       # 設定ファイル

db/
└── migrations/       # マイグレーションSQL
    └── 001_init.sql

data/
└── batch.db          # SQLiteデータベース（自動生成）
```

## Windows での実行

Windows環境では `make` の代わりに `cargo` コマンドを直接使用します。

### ビルド・実行

```powershell
# ビルド
cargo build

# リリースビルド
cargo build --release

# 実行
cargo run

# ジョブ一覧
cargo run -- --list

# 特定ジョブ実行
cargo run -- --job hello-world
cargo run -- --job db-init
cargo run -- --job item-crud
```

### 環境変数設定

```powershell
# PowerShell
$env:APP_ENV = "production"
$env:LOG_LEVEL = "info"
cargo run

# コマンドプロンプト
set APP_ENV=production
set LOG_LEVEL=info
cargo run
```

### テスト・開発

```powershell
# テスト
cargo test

# 詳細出力
cargo test -- --nocapture

# フォーマット
cargo fmt

# Linter
cargo clippy

# クリーン
cargo clean
```

### 注意事項

- パス区切りは `/` でも動作します（Rustが自動変換）
- SQLiteデータベースは `data\batch.db` に作成されます
- 設定ファイルは `env\config.yaml` を使用

## Make ターゲット一覧（Linux/macOS）

```bash
make help  # 全ターゲット表示
```

| ターゲット | 説明 |
|-----------|------|
| `build` | デバッグビルド |
| `release` | リリースビルド |
| `run` | ワークフロー実行 |
| `test` | テスト実行 |
| `fmt` | コードフォーマット |
| `clippy` | Linter実行 |
| `check` | fmt + clippy |
| `clean` | ビルド成果物削除 |
| `list` | ジョブ一覧表示 |
| `hello-world` | hello-worldジョブ |
| `db-init` | db-initジョブ |
| `item-crud` | item-crudジョブ |
