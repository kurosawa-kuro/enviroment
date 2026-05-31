# Framework Library

技術選定や移植時に参照するブループリント集。

`starters/` は実装済みの正典スターターを置く場所。このディレクトリは、まだ starter として昇格していない技術や、比較検討用の設計方針を整理する場所。

## 構成

| 場所 | 用途 |
|---|---|
| [web/](./web/) | Web API / frontend framework の設計ブループリント |
| [web/backend/](./web/backend/) | API backend framework |
| [web/frontend/](./web/frontend/) | SPA / frontend framework |
| [ml/](./ml/) | ML / MLOps framework の設計ブループリント |
| [ml/classical/](./ml/classical/) | scikit-learn など classical ML |
| [ml/cloud/](./ml/cloud/) | Vertex AI など managed ML platform |

## 使い分け

| 目的 | 見る場所 |
|---|---|
| 実装済みスターターを使う | `starters/*/README.md` |
| Web API の技術選定をする | [web/backend/](./web/backend/) |
| 管理画面や SPA の構成を決める | [web/frontend/](./web/frontend/) |
| ML pipeline の最小構成を決める | [ml/classical/](./ml/classical/) |
| GCP / Vertex AI へ拡張する | [ml/cloud/](./ml/cloud/) |

## 公開安全

- 実 Project ID、bucket 名、service account email、通知先、API key は置かない。
- `.env`, `secret.yaml`, `credentials.json`, `service-account.json` は公開しない。
- 実データ、実ログ、実 prompt、実検索クエリ、個人の監視対象は含めない。
- サンプル値は `example`, `dummy`, `your-project` などに一般化する。
