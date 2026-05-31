# Python FastAPI Starter

ML アプリや小さな CRUD API 向けの FastAPI スターター。

Jinja テンプレートを使い、専用フロントエンドを立てずに最小の Web UI を提供する。Cloud Run / GKE で拾いやすい structured logging helper も含む。

## 構成

```text
src/
  micropost_api/
    main.py             # FastAPI app factory
    db.py               # SQLite + SQLAlchemy session
    models.py           # Micropost model
    gcp_logging.py      # Cloud Logging style middleware
    web/
      routes.py         # HTML routes
    templates/          # Jinja templates
env/
  config.yaml    # 公開してよい一般設定サンプル
tests/           # unit tests
e2e/             # e2e tests
```

## セットアップ

```bash
python3 -m venv venv
source venv/bin/activate
make install
```

## 起動

```bash
make run
```

確認:

```bash
curl http://127.0.0.1:8000/healthz
```

## テスト

```bash
make test
```

## 設定

デフォルトではローカル SQLite を使う。生成される `microposts.db` は `.gitignore` 対象。

`env/config.yaml` は公開してよい一般設定サンプル。実行時の DB URL や Cloud Logging 設定は環境変数で上書きする。

Cloud Logging 風の JSON ログを有効にする場合:

```bash
GCP_LOGGING_ENABLED=1 make run
```

## 公開安全

- `microposts.db` はコミットしない。
- 実 `DATABASE_URL`、service account、API key、token は置かない。
- 秘密情報が必要になったら `env/secret.yaml` や `.env` を使い、コミットしない。
- サンプルデータは fixture / dummy のみ使う。
