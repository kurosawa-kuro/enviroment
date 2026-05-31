# GCP Vertex AI ML Blueprint

GCP 上で ML 実験、学習、成果物管理、推論、監視へ拡張する時の公開用ブループリント。

この starter-kit では、まず `starters/python/ml` の GCS artifact store + BigQuery metrics mart + run manifest を最小構成にする。Vertex AI はその次の段階として、Custom Training、Pipelines、Model Registry、Batch Prediction、Model Monitoring に接続する。

## 採用する場面

- ローカル学習ではなく、GCP 管理下の training job として実行したい。
- GCS に保存した model artifact を Model Registry に登録したい。
- BigQuery / GCS を入力・出力にして batch prediction を回したい。
- pipeline run、artifact lineage、定期 retraining、monitoring を運用に入れたい。
- Cloud Run Job / GitHub Actions / Composer から一段進めて、ML workflow を Vertex AI 側に寄せたい。

小さい portfolio や検証段階では、いきなり Vertex AI Pipelines に入れず、`starters/python/ml` の local + GCS + BigQuery で十分なことが多い。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Training | Vertex AI Custom Training / Training Pipeline |
| Orchestration | Vertex AI Pipelines |
| Pipeline SDK | Kubeflow Pipelines SDK または TFX |
| Artifact Store | Cloud Storage |
| Metrics Mart | BigQuery |
| Model Management | Vertex AI Model Registry |
| Batch Inference | Vertex AI Batch Prediction |
| Online Inference | Vertex AI Endpoint |
| Monitoring | Vertex AI Model Monitoring + BigQuery metrics |
| Auth | ADC / Workload Identity / service account impersonation |

## 段階設計

| 段階 | 目的 | 実装 |
|---|---|---|
| Local | 再現可能な training run | `PYTHONPATH=src python3 -m housing_ml.cli --output-dir artifacts` |
| GCS | artifact の永続化 | `gs://bucket/models/{model_name}/{run_id}/` |
| BigQuery | 実験比較 | `gold_model_metrics` |
| Registry | model version 管理 | Vertex AI Model Registry |
| Batch Prediction | 蓄積データの推論 | BatchPredictionJob |
| Pipeline | 再学習の自動化 | Vertex AI Pipelines |
| Monitoring | 本番品質監視 | Model Monitoring / metrics mart |

## ディレクトリ

```text
src/project_ml/
  pipelines/
    train_pipeline.py
    batch_predict_pipeline.py
  registry/
    register_vertex_model.py
  infra/
    gcs.py
    bigquery.py
    vertex_ai.py
configs/
  local.yaml
  gcp.example.yaml
docker/
  Dockerfile.train
scripts/
  train_local.sh
  train_vertex.sh
  register_model.sh
  batch_predict.sh
```

## Artifact Layout

```text
gs://example-ml-artifacts/models/lightgbm-california-housing/{run_id}/
  model.txt
  metrics.json
  feature_importance.csv
  run.json
```

公開リポジトリでは bucket 名、Project ID、dataset 名、service account email は dummy にする。実値は README、config、workflow に書かない。

## Vertex AI への接続

### Custom Training

単発の training job として動かす段階。training code は Python package または custom container にする。

```text
inputs:  dataset uri / params / output uri
outputs: GCS model artifact package
```

### Training Pipeline

training job と model resource 作成をまとめたい段階。単純な「学習して model を登録する」用途なら Training Pipeline で足りる。

### Vertex AI Pipelines

data validation、feature build、train、evaluate、register、batch prediction までを DAG として管理したい段階。component は self-contained にし、入力・出力 artifact を明示する。

```text
prepare_data -> build_features -> train_model -> evaluate_model -> register_model
                                                       \
                                                        -> batch_predict
```

### Model Registry

GCS の registry-ready package を登録し、version / alias / metadata を管理する。登録時には以下を metadata として残す。

```json
{
  "run_id": "20260530-123456",
  "model_name": "lightgbm-california-housing",
  "dataset_name": "california-housing",
  "metrics_uri": "gs://example/path/metrics.json",
  "metrics_table": "example_project.ml.gold_model_metrics"
}
```

### Batch Prediction

即時応答が不要な蓄積データ推論は Batch Prediction を使う。input は BigQuery table または GCS、output は BigQuery table または GCS にする。

## IAM / Security

- service account key JSON は作らない。ADC、Workload Identity、service account impersonation を優先する。
- `GOOGLE_APPLICATION_CREDENTIALS`, `credentials.json`, `service-account.json` は公開しない。
- Project ID、Project Number、service account email、bucket 名、dataset 名、endpoint 名は公開用に一般化する。
- Vertex AI job には最小権限の service account を使う。
- GitHub Actions から実行する場合は Workload Identity Federation を使い、長期鍵を置かない。

## 実装ルール

- local run と cloud run の出力形式を揃える。
- GCS artifact と BigQuery metrics は同じ `run_id` で結ぶ。
- pipeline component は file path や project id を直書きせず、parameter と config で受ける。
- model registry は「成果物置き場」ではなく、version と deployment 判定の管理先として使う。
- endpoint deploy は最初から必須にしない。batch prediction だけで十分な用途も多い。
- monitoring は Vertex AI だけに閉じず、BigQuery metrics mart でも追えるようにする。

## スターター対応

| スターター | GCP / Vertex AI への接続 |
|---|---|
| `starters/python/ml` | GCS artifact store / BigQuery metrics mart / registry-ready package |
| `starters/python/gcp` | GCS / BigQuery helper の最小 CLI |
| `script/gcp/` | gcloud / project / service account / storage の補助 script |
| `starters/infra/terraform` | GCP resource を IaC へ寄せる前段 |

## 公開前チェック

- 実 Project ID、bucket 名、dataset 名、service account email が残っていないか確認する。
- GCS URI は `gs://example-bucket/...` にする。
- BigQuery table は `example_project.example_dataset.table` にする。
- `terraform.tfstate`, `*.tfvars`, `.terraform/`, service account key を含めない。
- 実 prompt、実検索クエリ、実運用ログ、評価データを含めない。

## 参考

- Vertex AI documentation: https://docs.cloud.google.com/vertex-ai/docs
- Vertex AI Pipelines: https://docs.cloud.google.com/vertex-ai/docs/pipelines/introduction
- Vertex AI predictions overview: https://docs.cloud.google.com/vertex-ai/docs/predictions/overview
- Vertex AI training pipelines: https://docs.cloud.google.com/vertex-ai/docs/training/create-training-pipeline
