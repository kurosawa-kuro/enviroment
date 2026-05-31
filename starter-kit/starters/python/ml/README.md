# LightGBM Housing ML Pipeline

California Housing の回帰モデルを題材にした、最小構成の ML Lakehouse 風パイプライン。

単体学習スクリプトではなく、Databricks / Lakehouse の考え方を GCP へ翻訳した構成にしている。

## 設計対応

| Databricks / Lakehouse 概念 | この starter での対応 |
|---|---|
| Bronze | `data/load.py` の raw dataset 読み込み |
| Silver | `data/validate.py` の入力検証 |
| Gold | `features/build.py` の model-ready feature table |
| Experiment Tracking | `metrics.json` + BigQuery metrics mart |
| Artifact Store | local `artifacts/` + optional GCS prefix |
| Model Registry 前段 | `run.json` manifest + model package |
| Batch / Job | `pipelines/train_pipeline.py` |

Databricks そのものを再現するのではなく、GCS artifact store、BigQuery metrics mart、run manifest による GCP 向けの最小 MLOps パターンとして整理している。

## ディレクトリ

```text
src/housing_ml/
  data/          # Bronze / Silver 相当
  features/      # Gold / model-ready features
  training/      # LightGBM training
  evaluation/    # metrics / feature importance
  registry/      # run manifest / registry-ready package
  infra/         # GCS / BigQuery integration
  pipelines/     # train pipeline orchestration
env/
  config.yaml    # 公開してよい一般設定サンプル
```

## セットアップ

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## ローカル学習

```bash
make train
```

または:

```bash
PYTHONPATH=src python3 -m housing_ml.cli --output-dir artifacts --seed 42
```

出力:

```text
artifacts/
  model.txt
  metrics.json
  feature_importance.csv
  run.json
```

## GCS / BigQuery 連携

```bash
PYTHONPATH=src python3 -m housing_ml.cli \
  --output-dir artifacts \
  --gcs-prefix gs://your-bucket/models/lightgbm-california-housing \
  --bq-metrics-table your-project.your_dataset.gold_model_metrics
```

BigQuery table は存在しなければ作成する。metrics mart の schema は `src/housing_ml/infra/bigquery.py` に定義する。

## 設定

`env/config.yaml` は公開してよい一般設定サンプル。実行時は CLI 引数を優先する。

実 bucket、実 BigQuery table、Project ID、service account、token は `env/config.yaml` に入れない。秘密情報が必要になったら `env/secret.yaml` や `.env` を使い、コミットしない。

## Source of Truth

- local run: `artifacts/run.json`
- GCP run: GCS 上の `run.json`
- 横断比較: BigQuery `gold_model_metrics`

本格的な Model Registry が必要になったら、GCS の registry-ready package を Vertex AI Model Registry に登録する。

## テスト

```bash
make test
```

## 公開安全ルール

- `artifacts/` の生成物はコミットしない。
- GCS bucket、BigQuery table、Project ID はサンプル値だけにする。
- API key、service account、Doppler token、実データを置かない。
