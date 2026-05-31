# 開発共通方針

starter-kit と、ここから生成されるプロジェクトで共通して守る基本方針。

## 作業姿勢

- 既存の `README.md`、`Makefile`、設定ファイルを読んでから変更する。
- 実行できる検証は実行する。実行できない場合は理由を残す。
- 仕様・構成を変えたら、関連ドキュメントも同時に更新する。
- 公開前提で作業し、秘密情報や実運用データを置かない。

## 設定と秘密情報

共有してよいもの:

```text
.env.example
config.example.yaml
env/config.yaml
```

コミットしないもの:

```text
.env
.env.*
env/secret.yaml
secret.yaml
credentials.json
service-account.json
*.pem
*.key
*.tfvars
*.tfstate
.doppler/
```

Doppler を使う場合も、token、実 Project 名、Config 名、Secret 名は公開用ドキュメントへ固定しない。

## ポート規約

| 種別 | 範囲 |
|---|---|
| フロント / 静的 UI | 3000 番台 |
| API | 8000 番台 |
| ミドルウェア / DB 管理 UI | 5000 番台 |

既存スターターが別ポートを使っている場合は、そのスターターの README を一次情報にする。

## Makefile 方針

スターターには可能な範囲で以下を用意する。

| Target | 用途 |
|---|---|
| `help` | 利用可能な target を表示 |
| `setup` / `install` | 依存関係の導入 |
| `run` / `dev` | ローカル実行 |
| `test` | 最低限のテスト |
| `fmt` | フォーマット |
| `lint` / `clippy` / `vet` | 静的検査 |
| `clean` | 生成物の削除 |

破壊的操作、デプロイ、課金が発生する操作は自動実行前提にしない。

## ディレクトリの基本形

小さなスターターでは単純さを優先する。必要になった時だけ分割する。

```text
project/
  README.md
  AGENTS.md
  CLAUDE.md
  Makefile
  .gitignore
  env/
    config.yaml
    secret.yaml
  src/
  tests/
  doc/
    README.md
    01_仕様と設計.md
    02_移行ロードマップ.md
    03_実装カタログ.md
    04_運用.md
```

## 技術別検証

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

共通:

```bash
git diff --check
```

## UI 方針

スターターの目的に合う UI を優先する。管理画面や運用ツールは、装飾よりも一覧性、入力しやすさ、状態確認のしやすさを重視する。

CSS framework は必須ではない。既存のデザイン方針がある場合はそれに合わせる。
