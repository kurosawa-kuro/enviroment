# Python GCP Batch Starter

SQLite のローカル CRUD を起点に、GCS / BigQuery へエクスポートする Python バッチスターター。

GCP 連携は任意。ローカル実行だけなら Google Cloud 認証は不要。

## 構成

```text
src/
  micropost_gcp/
    cli.py            # argparse CLI
    db.py             # SQLite + SQLAlchemy session
    models.py         # Micropost model
    repository.py     # CRUD operations
    exporters/
      gcp.py          # GCS / BigQuery helpers
env/
  config.yaml # 公開してよい一般設定サンプル
```

## セットアップ

```bash
python3 -m venv venv
source venv/bin/activate
make install
```

## ローカル実行

```bash
make seed
make list
```

CLI:

```bash
PYTHONPATH=src python3 -m micropost_gcp.cli create --title "Hello" --content "Local batch"
PYTHONPATH=src python3 -m micropost_gcp.cli list
PYTHONPATH=src python3 -m micropost_gcp.cli export-gcs --output posts.ndjson
```

## GCS / BigQuery

GCS:

```bash
PYTHONPATH=src python3 -m micropost_gcp.cli export-gcs --gcs-uri gs://your-bucket/path/posts.ndjson
```

BigQuery:

```bash
PYTHONPATH=src python3 -m micropost_gcp.cli export-bq --table your-project.your_dataset.microposts
```

## 設定

`env/config.yaml` は公開してよい一般設定サンプル。実行時は CLI 引数と ADC / Workload Identity を優先する。

実 GCS URI、実 Project ID、service account、token は `env/config.yaml` に入れない。秘密情報が必要になったら `env/secret.yaml` や `.env` を使い、コミットしない。

## 公開安全

- `microposts.db`、`*.ndjson`、実 GCS URI、実 Project ID はコミットしない。
- service account key は置かない。ローカルでは ADC や Workload Identity を使う。
- 実データではなくダミーデータで動作確認する。
