# AGENTS.md

このファイルは、このリポジトリで作業する AI エージェント向けの実務ルール。

詳細な背景やコマンド一覧は [CLAUDE.md](CLAUDE.md) と [README.md](README.md) も参照する。ただし、作業判断で迷った場合はこの `AGENTS.md` の安全方針を優先する。

実際の作業ディレクトリは `/home/ubuntu/repos/private-kit/starter-kit` とする。

## まず守ること

- 推測で編集しない。対象ファイル、周辺 README、既存 Makefile を読んでから変更する。
- ユーザーの未コミット変更を戻さない。`git reset --hard` や `git checkout --` は使わない。
- 変更したら、可能な範囲で実行確認する。少なくとも `git diff --check` は通す。
- 仕様・構成を変えたら、関連する `README.md` / `docs/` / `CLAUDE.md` も同時に更新する。
- 公開前提のリポジトリとして扱う。秘密情報、個人用途、実運用データを入れない。

## リポジトリの性格

`starter-kit` は、よく使う構成を素早く始めるためのスターター集。

現在の優先順位は以下。

1. Rust
2. Python
3. Terraform
4. バッチ

通常 API は `Rust + axum` を優先する。ML アプリ API は `Python + FastAPI` を使う。フロントエンドは原則として大きな SPA に寄せず、Jinja / HTML テンプレート / 最小 CSS / 最小 JS を優先する。

React / Next.js / TypeScript Web API / 多言語レガシー雛形は削除しないが、基本的には `optional/` に置いて前面に出さない。

## ディレクトリ方針

```text
starters/                 # 正典スターター。ユーザーが直接選ぶメイン級
  rust/                   # Rust CLI / batch / API / fullstack
  python/                 # Python batch / ML / GCP / FastAPI
  frontend/               # 静的 HTML 管理画面
  infra/                  # Terraform など IaC
optional/                 # 既存資産・低優先・レガシー。削除せず目立たせない
tools/project-generator/  # 新規プロジェクト生成 CLI
docs/                     # 方針・ガイド・参照ブループリント
script/                   # 共有スクリプト
```

`starters/` に置くものは、最低限 `README.md`、実行方法、テスト方法、公開してよいサンプル設定を持つこと。

`optional/` は「不要」ではなく「通常の導線では目立たせない」場所。移動・整理するときは README と docs の参照を必ず更新する。

## 現在の正典スターター

```text
starters/
  rust/
    cli/
    batch/
    api-axum/
    api-axum-fullstack/
  python/
    batch/
    ml/
    gcp/
    api-fastapi/
  frontend/
    admin-pico/
  infra/
    terraform/
```

新しいメイン級スターターを追加・移動した場合は、少なくとも以下を更新する。

- [README.md](README.md)
- [CLAUDE.md](CLAUDE.md)
- [docs/STARTER-POLICY.md](docs/STARTER-POLICY.md)
- 対象スターターの `README.md`

## 公開安全ルール

Public GitHub に出す前提で作業する。

コミットしてはいけないもの:

- `.env`, `.env.*`
- `env/secret.yaml`, `secret.yaml`, `secrets.yaml`
- `credentials.json`, `service-account.json`
- `*.pem`, `*.key`
- `*.tfvars`, `*.tfstate`, `.terraform/`
- `.doppler/`, Doppler token, 実 Project 名 / Config 名 / Secret 名
- Discord / Slack / Telegram webhook URL
- DB 接続 URL、API key、Bearer token、Cookie、Session ID
- 個人の監視対象、通知先、検索クエリ、運用ログ、実データ

共有する設定は、必ずサンプルにする。

```text
.env.example
config.example.yaml
env/config.yaml        # 公開してよい一般設定だけ
```

`env/secret.yaml` はテンプレートとして明示的に扱う場合を除き、生成先では `.gitignore` 対象にする。

## project-generator の注意

`tools/project-generator/` は、テンプレートから新規プロジェクトを生成する CLI。

テンプレート構成は次を前提にする。

```text
templates/
  .gitignore
  CLAUDE.md
  AGENTS.md
  Makefile
  README.md
  doppler.yaml
  env/
    config.yaml
    secret.yaml
  src/
  doc/
    README.md
    01_仕様と設計.md
    02_移行ロードマップ.md
    03_実装カタログ.md
    04_運用.md
```

生成後のプロジェクトでは、`env/secret.yaml` をコミットさせない `.gitignore` を必ず含める。ただし、generator 自体のテンプレートとしての `templates/env/secret.yaml` は、公開してよいダミー内容であれば追跡してよい。

## ドキュメント方針

- `docs/README.md` はドキュメント全体の索引。
- `docs/STARTER-POLICY.md` はスターターの配置判断の根拠。
- `docs/framework-library/` は正典スターターではなく、Web / ML framework 別の参照ブループリント。
- 古い個人アプリ由来の手順、実プロジェクト名、実通知先、実ログを docs に残さない。

ドキュメントは「今後の生成・移植で迷わないこと」を目的にする。過去メモをそのまま保存する場所ではない。

## 作業前チェック

作業開始時は必要に応じて以下を見る。

```bash
git status --short
rg --files
rg -n "対象キーワード" .
```

特定スターターを編集する場合は、対象配下の `README.md` と `Makefile` を先に読む。

## よく使う検証

Rust:

```bash
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

Python:

```bash
python3 -m unittest discover -s tests
python3 -m pytest
```

Node / TypeScript:

```bash
npm test
npm run lint
npm run build
```

Terraform:

```bash
terraform fmt -check -recursive
terraform validate
```

全変更共通:

```bash
git diff --check
```

存在しないツールや依存関係で検証できない場合は、最終報告で明記する。

## 編集スタイル

- 既存の構成と命名を優先する。
- 大きな抽象化を増やす前に、既存パターンで足りるか確認する。
- サンプル値は `example`, `localhost`, `changeme`, `your-project` などに留める。
- 実在しそうな個人名、アカウント名、プロジェクト名、URL をサンプルに使わない。
- 生成物、キャッシュ、ログ、テスト出力をコミット対象にしない。

## 迷った時の判断

- メイン級なら `starters/`。
- 低優先・比較用・レガシーなら `optional/`。
- 実装ではなく設計判断の参照なら `docs/`。
- 新規プロジェクト生成に必要なら `tools/project-generator/templates/`。
- 公開してよいか迷う情報は、公開しない。
