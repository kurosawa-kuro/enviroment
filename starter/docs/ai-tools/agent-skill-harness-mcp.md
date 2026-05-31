# Agent / Skill / Harness / MCP 方針

AI コーディング環境を整理する時の考え方。

## 役割分担

| 種別 | 役割 |
|---|---|
| Agent | 担当者。Rust、Python ML、Terraform、Review などの役割で分ける |
| Skill | 作業手順。API 実装、ML pipeline、Terraform review など |
| Harness | 検証ゲート。fmt、lint、test、smoke test、plan |
| MCP / Connector | 外部接続。GitHub、Google Drive、DB、cloud docs など |

## starter-kit 向けの最小構成

Agents:

```text
rust-axum
python-ml-fastapi
terraform-gcp
reviewer
test-fixer
```

Skills:

```text
rust-api-implementation
python-ml-pipeline
terraform-plan-review
project-generator-maintenance
public-repo-safety-check
```

Harness:

```text
cargo fmt / clippy / test
python unittest / pytest
npm test / lint / build
terraform fmt / validate
git diff --check
```

## このリポジトリでの注意

- `starters/` はメイン級、`optional/` は低優先・比較用・レガシー。
- Python ML は単体学習ではなく、GCS artifact、BigQuery metrics、manifest へつながる pipeline として扱う。
- Cloud / GCP 操作は `script/gcp/` と `starters/infra/terraform/` を優先して見る。
- 公開前提なので、実 Project ID、実通知先、secret、credential、運用ログを残さない。

## レビュー観点

- 既存方針から外れていないか。
- ドキュメントとコードが同じ構成を説明しているか。
- 検証コマンドが実行できるか。
- 生成物や秘密情報が混ざっていないか。
- 過剰なフレームワーク導入になっていないか。
