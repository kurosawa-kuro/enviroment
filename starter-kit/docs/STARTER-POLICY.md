# スターターキット構成方針

## 目的

新規プロジェクトを始める時に、よく使う構成へ迷わず到達できる状態を保つ。

このリポジトリは技術カタログではなく、実際に使うスターターを前に出すための作業台。使う頻度が低いもの、比較用、レガシー資産は削除せず `optional/` に下げる。

## 優先順位

1. Rust
2. Python
3. Terraform
4. バッチ

## 配置判断

| 配置 | 判断基準 |
|---|---|
| `starters/` | 今後も直接選ぶメイン級スターター |
| `optional/` | 残すが通常導線では目立たせない既存資産 |
| `tools/` | スターターを生成・検査・補助するツール |
| `docs/` | 方針、参照ブループリント、生成先ドキュメント雛形 |
| `script/` | リポジトリ横断の補助 CLI |

## 正典スターター

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

## 技術方針

### Rust

CLI、バッチ、通常 API の第一候補。API は原則 `axum`。

対象:

- `starters/rust/cli`
- `starters/rust/batch`
- `starters/rust/api-axum`
- `starters/rust/api-axum-fullstack`

### Python

単純バッチ、ML、GCP 連携、ML アプリ API で使う。

対象:

- `starters/python/batch`
- `starters/python/ml`
- `starters/python/gcp`
- `starters/python/api-fastapi`

`starters/python/ml` は単体学習スクリプトではなく、GCS artifact store、BigQuery metrics mart、run manifest へつながる最小 ML pipeline として扱う。

### Terraform

IaC の第一候補。GCP を優先し、AWS は必要時に補足する。

対象:

- `starters/infra/terraform`

### バッチ

軽いローカル workflow や補助 script。高頻度・長期運用化するものは Rust / Python へ移す。

対象:

- `script/gcp`

TypeScript の workflow-runner は正典スターターから外し、比較・参照用として `optional/typescript-workflow-runner` に下げる。workflow-runner を正典化するなら Python 版として設計する。

## API 方針

```text
通常 API       : Rust + axum
ML アプリ API  : Python + FastAPI
```

## フロントエンド方針

デフォルトでは大きな SPA に寄せない。

優先:

- Jinja / server-side template
- 静的 HTML
- 最小 CSS
- 必要最小限の JavaScript

`admin-pico` はこの方針を体現するメイン級スターターとして `starters/frontend/admin-pico` に置く。

React / Next.js / Vue / Hono / Express / JVM / Go / ML platform などの参照情報は `docs/framework-library/` に置く。実装資産は必要に応じて `optional/` に残す。

## optional の扱い

`optional/` は削除予定置き場ではない。通常導線で前面に出さないだけ。

該当例:

- React / Next.js / Vue などのフロント専用構成
- TypeScript Web API
- TypeScript workflow runner
- Go / JVM / Express などの比較用またはレガシー雛形
- 過度な Docker / Kubernetes / CI/CD 構成

## 新規追加時の必須確認

新しいスターターを追加・移動したら、最低限以下を更新する。

- ルート `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- 本ファイル
- 対象スターターの `README.md`

Public 公開前提で、実 Project ID、実通知先、API key、token、`.env`、`env/secret.yaml`、`*.tfvars`、生成 artifact は含めない。
