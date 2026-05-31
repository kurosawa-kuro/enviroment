# Starter Kit

利用頻度の高い技術を前提にした、プロジェクト作成用スターターキット集。
構成方針の詳細は [docs/STARTER-POLICY.md](docs/STARTER-POLICY.md) を参照。

この資産群は `/home/ubuntu/repos/private-kit/starter` 配下で管理する。

## 基本方針

- 優先順位: **Rust → Python → Terraform → バッチ**
- 通常 API は **Rust + axum**、ML アプリ API は **Python + FastAPI**
- フロントは専属フレームワークを避け、**Jinja / HTML テンプレート / 最小 CSS / 最小 JS** で我慢する
- React / Next.js などは削除せず、`optional/` に置いて**目立たせない**

## スターター一覧（優先順）

| # | スターター | 用途 | 主技術 |
|---|---|---|---|
| 1 | [rust/cli](starters/rust/cli/) | CLI / 小規模ツール / 高速ユーティリティ | Rust + clap |
| 2 | [rust/batch](starters/rust/batch/) | バッチ処理 / ジョブ実行 | Rust + tokio |
| 3 | [rust/api-axum](starters/rust/api-axum/) | 通常 API | Rust + axum |
| 4 | [rust/api-axum-fullstack](starters/rust/api-axum-fullstack/) | axum + React 同梱フルスタック | Rust + axum + React |
| 5 | [python/batch](starters/python/batch/) | 単純な CSV/JSON バッチ | Python 標準ライブラリ |
| 6 | [python/ml](starters/python/ml/) | ML モデル学習 | scikit-learn + LightGBM |
| 7 | [python/gcp](starters/python/gcp/) | GCP 連携 / データ処理 | Python + BigQuery/GCS |
| 8 | [python/api-fastapi](starters/python/api-fastapi/) | ML アプリ用 API | Python + FastAPI |
| 9 | [infra/terraform](starters/infra/terraform/) | IaC / インフラ構成管理 | Terraform (GCP 優先) |
| – | [frontend/admin-pico](starters/frontend/admin-pico/) | フロント方針を体現する管理画面 | Pico CSS 静的 HTML |

各スターターの開発コマンドは、それぞれの `Makefile` / `package.json` を参照。

## ディレクトリ構成

```text
starter/
├── starters/     # 正典スターター（上表）
├── optional/     # 目立たせない既存資産（削除はしない）
├── tools/        # 補助ツール
├── docs/         # ドキュメント（方針・ガイド等）
└── script/       # 共有スクリプト
```

## optional/（目立たせない・必要時のみ）

方針上は前面に出さないが、資産として保持しているもの。

- `optional/admin/` — 管理画面 UI（React / Vue / Next / Nuxt / HTML）
- `optional/nextjs/` — Next.js フロント
- `optional/ts-hono-api/` — TypeScript + Hono API
- `optional/typescript-workflow-runner/` — TypeScript workflow runner（正典スターターから降格）
- `optional/legacy-multistack/` — 多言語レガシー雛形（Go / JVM / Express など）/ 各種ユーティリティ

## tools/

- `tools/project-generator/` — 新規プロジェクトの雛形生成 CLI（旧 `starter-cli`、埋め込みテンプレート方式）

## script/

- `script/gcp/` — `gcloud` / Artifact Registry / Cloud Run / Secret Manager の補助 CLI
- `script/cleanup-generated.sh` — `target/` / `.terraform/` / `__pycache__` などの生成物掃除

## 開発環境の前提

- Rust (stable) / Cargo
- Python 3.10+
- Node.js 18+（optional の TypeScript 系を確認する場合）
- Terraform 1.5+

詳細は `CLAUDE.md` を参照。
