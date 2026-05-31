# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

利用頻度の高い技術を前提にしたスターターキット集。構成方針は
[docs/STARTER-POLICY.md](docs/STARTER-POLICY.md)、概要は [README.md](README.md) を参照。

実体の配置先ディレクトリは `/home/ubuntu/repos/private-kit/starter-kit`。

- 優先順位: **Rust → Python → Terraform → バッチ**
- 通常 API は **Rust + axum**、ML アプリ API は **Python + FastAPI**
- フロントは **Jinja / HTML テンプレート / 最小 CSS / 最小 JS**（`admin-pico` がその体現）
- React / Next.js 等は削除せず `optional/` に退避して**目立たせない**

## Project Structure

```text
starter-kit/
├── starters/                 # 正典スターター（優先順）
│   ├── rust/                 # Rust CLI / batch / API / fullstack
│   ├── python/               # Python batch / ML / GCP / FastAPI
│   ├── frontend/             # 静的 HTML 管理画面
│   └── infra/                # Terraform など IaC
├── optional/                 # 目立たせない既存資産（削除しない）
│   ├── admin/                # 管理画面 UI（React/Vue/Next/Nuxt/HTML）
│   ├── nextjs/               # Next.js フロント
│   ├── ts-hono-api/          # TypeScript + Hono API
│   ├── typescript-workflow-runner/  # TypeScript workflow runner（降格済み）
│   └── legacy-multistack/    # 多言語レガシー雛形・各種ユーティリティ
├── tools/
│   └── project-generator/    # 雛形生成 CLI（旧 starter-cli, 埋め込みテンプレート方式）
├── docs/                     # 方針・ガイド（index: docs/README.md）
└── script/                   # 共有スクリプト（GCP CLI 補助は script/gcp/）
```

## Common Development Commands

各スターターは `Makefile` を持つ（`make help` で一覧）。代表例:

### Rust starters (starters/rust/*)
```bash
make build      # cargo build
make run        # cargo run
make test       # cargo test
make fmt        # cargo fmt
make clippy     # cargo clippy -- -D warnings
```

### Python starters (starters/python/*)
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# fastapi: PYTHONPATH=src uvicorn micropost_api.main:app --reload
```

### terraform (starters/infra/terraform)
```bash
make init
make plan ENV=dev      # environments/<env>.tfvars を使用
make apply ENV=dev
make fmt && make validate
```

### optional/typescript-workflow-runner
```bash
npm install
npm run dev
npm test
```

### tools/project-generator
```bash
cargo build     # 埋め込みテンプレート方式。サンプルディレクトリへの実行時依存なし
```

### script/gcp
```bash
script/gcp/gcp-auth-check.sh --project your-project --region asia-northeast1
script/gcp/gcp-enable-services.sh --project your-project
script/gcp/gcp-cloud-run-inspect.sh --project your-project --region asia-northeast1 --service your-service
```

## 作業ルール

- 推測でコードを書かない。コマンドを書いたら**実際に実行して確認**する。
- 仕様変更は連動する `docs/` を**同一変更で更新**する（drift を作らない）。
- 既存の関数・ユーティリティ・パターンを**優先的に再利用**する。
- 秘密情報は **Doppler** で管理。`.env` / `*.tfvars.local` はコミットしない
  （ハーネスで読取を deny 済み）。
- ポート規約: フロント 3000 番台 / バックエンド 8000 番台 / ミドルウェア 5000 番台
  （`docs/guides/development-principles.md` 準拠）。

## ハーネス

このリポジトリには Claude Code 用の設定が `.claude/` にある。

- **自動フォーマット**: ファイル編集後、`.rs` は `rustfmt`、`.tf`/`.tfvars` は
  `terraform fmt` が PostToolUse フック（`.claude/hooks/format.sh`）で自動実行される。
- **権限**: `.claude/settings.json` で `cargo` / `npm` / `pytest` / `terraform`(非破壊) /
  安全な `make` ターゲットなどは自動許可。`terraform apply` / `make apply|deploy` /
  `doppler run` / `git push` は確認プロンプトになる。
- **スラッシュコマンド**:
  - `/new-starter <name> <用途>` — 規約どおり新スターターを追加。
  - `/check <starter>` — 対象スターターの品質ゲート（fmt / lint / test）を実行。

## Notes

1. 各プロジェクトの `Makefile` / `package.json` が最新コマンドの一次情報。
2. テンプレート間にハードコードされた相互参照は無い（ディレクトリは独立して移動可能）。
3. 新規追加は原則 `starters/` に正典として置き、方針外のフロント/レガシーは `optional/` へ。
