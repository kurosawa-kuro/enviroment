# ML Frameworks

ML / MLOps の参照ブループリント。

`starters/python/ml` を正典スターターにし、ここでは classical ML と managed ML platform の設計方針を分けて管理する。

## 構成

| 場所 | 用途 |
|---|---|
| [classical/](./classical/) | scikit-learn / LightGBM などの小さな ML pipeline |
| [cloud/](./cloud/) | Vertex AI など managed ML platform |

## 採用判断

| 要件 | 推奨 |
|---|---|
| tabular data の小さな分類・回帰 | [classical/scikit-learn.md](./classical/scikit-learn.md) |
| GCS / BigQuery と接続する ML pipeline | `starters/python/ml` |
| Vertex AI の training / registry / prediction | [cloud/gcp-vertex-ai.md](./cloud/gcp-vertex-ai.md) |

## 公開安全

- 実 dataset、実特徴量、実評価データ、実 prompt、実ログは公開しない。
- GCS bucket、BigQuery table、Project ID は dummy にする。
- model artifact は sample / generated のみにする。
