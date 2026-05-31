# scikit-learn ML Blueprint

scikit-learn 系のモデルを使って、公開用の小さな ML 実験・学習パイプラインを作る時のブループリント。

この starter-kit では、`starters/python/ml` が ML 実験・成果物管理・DWH 連携の正典スターター。scikit-learn は「 notebook で試すだけ」ではなく、data / features / training / evaluation / registry-ready artifact に分けて扱う。

## 採用する場面

- tabular data の分類・回帰を小さく始めたい。
- LightGBM / XGBoost / scikit-learn estimator を比較したい。
- MLflow や Vertex AI に入る前に、ローカルで再現可能な training run を作りたい。
- BigQuery metrics mart や GCS artifact store へ自然に接続したい。

画像、音声、LLM、巨大データ分散学習を主目的にする場合は、scikit-learn 単体ではなく Vertex AI / PyTorch / TensorFlow / Spark 系を検討する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Python 3.11 以上 |
| Core ML | scikit-learn stable |
| Tabular Boosting | LightGBM または XGBoost |
| DataFrame | pandas |
| Metrics | scikit-learn metrics |
| Artifact | joblib / model native format |
| Config | YAML または CLI args |
| Test | unittest / pytest |
| Optional Cloud | GCS artifacts + BigQuery metrics |

## ディレクトリ

```text
src/project_ml/
  data/
    load.py
    split.py
    validate.py
  features/
    build.py
    schema.py
  training/
    train_model.py
    params.py
  evaluation/
    metrics.py
    explain.py
  registry/
    manifest.py
  infra/
    gcs.py
    bigquery.py
  pipelines/
    train_pipeline.py
tests/
  test_split.py
  test_metrics.py
  test_manifest.py
artifacts/
  .gitkeep
Makefile
README.md
```

## レイヤー対応

| Lakehouse / MLOps 概念 | scikit-learn 構成 |
|---|---|
| Bronze | raw dataset の読み込み |
| Silver | validation / cleaning |
| Gold | model-ready feature table |
| Experiment | run id / metrics / params |
| Artifact Store | local `artifacts/` / GCS prefix |
| Metrics Mart | BigQuery `gold_model_metrics` |
| Registry 前段 | `run.json` + model package |

## Training Run の最小成果物

```text
artifacts/
  model.joblib
  metrics.json
  feature_importance.csv
  run.json
```

`run.json` には最低限、以下を入れる。

```json
{
  "run_id": "20260530-123456",
  "model_name": "lightgbm-california-housing",
  "dataset_name": "california-housing",
  "metrics": {
    "rmse": 0.0,
    "mae": 0.0,
    "r2": 0.0
  },
  "artifact_uri": "artifacts/20260530-123456",
  "created_at": "2026-05-30T00:00:00Z"
}
```

## 実装ルール

- root 直下に互換用の学習 script を残さない。正式入口は package CLI に寄せる。
- load / split / train / evaluate / save を関数または module に分ける。
- `random_state` / seed を必ず固定し、run manifest に残す。
- train / validation / test の分割ロジックをテストする。
- metrics は stdout だけでなく `metrics.json` に保存する。
- model artifact と metrics は同じ `run_id` 配下に保存する。
- feature importance はある場合だけ出す。モデルにない概念を無理に作らない。
- notebook は探索用に限定し、本番 run の source of truth にしない。
- 実データ、実 bucket、実 BigQuery table、実 Project ID は公開しない。

## BigQuery Metrics Mart

```text
gold_model_metrics
  run_id STRING
  model_name STRING
  dataset_name STRING
  rmse FLOAT64
  mae FLOAT64
  r2 FLOAT64
  artifact_uri STRING
  created_at TIMESTAMP
```

metrics mart は「実験比較の読み取り先」にする。ローカル run の source of truth は `run.json`、クラウド run の source of truth は GCS 上の `run.json` にする。

## スターター対応

| スターター | 用途 |
|---|---|
| `starters/python/ml` | LightGBM + GCS + BigQuery の ML pipeline |
| `starters/python/gcp` | GCS / BigQuery helper の最小 batch |
| `starters/python/batch` | 外部クラウドなしの単純 batch |

## Makefile 例

```makefile
.PHONY: install train test clean

install:
	python3 -m pip install -r requirements.txt

train:
	PYTHONPATH=src python3 -m project_ml.cli --output-dir artifacts

test:
	PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests

clean:
	rm -rf artifacts/*
	touch artifacts/.gitkeep
```

## 参考

- scikit-learn User Guide: https://scikit-learn.org/stable/user_guide.html
