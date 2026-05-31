# FastAPI Blueprint

Python + FastAPI で Web API または小さな CRUD アプリを作る時の公開用ブループリント。

この starter-kit では、`starters/python/api-fastapi` を FastAPI の正典スターターにする。専用フロントエンドを立てず、Jinja テンプレートで最小 UI を持つ構成を基本にする。

## 採用する場面

- Python の既存資産、ML、batch、データ処理と Web API を近づけたい。
- 小さな CRUD、管理 UI、社内 API を短時間で作りたい。
- OpenAPI / Swagger UI を標準で持たせたい。
- Cloud Run / container に載せる Python API の最小構成が欲しい。

長期運用で型安全な低レイヤ API に寄せたい場合は [rust.md](./rust.md) も検討する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Python 3.11 以上 |
| Framework | FastAPI |
| ASGI Server | Uvicorn |
| Template | Jinja2 |
| ORM | SQLAlchemy / SQLModel |
| Validation | Pydantic |
| Test | unittest または pytest + TestClient |
| Logging | standard logging / JSON structured logging |
| Config | environment variables / `.env.example` only |

## ディレクトリ

```text
src/
  micropost_api/
    main.py
    db.py
    models.py
    schemas.py
    services/
      micropost_service.py
    web/
      routes.py
    templates/
      base.html
      index.html
tests/
  test_app.py
e2e/
  test_workflow.py
env/
  config.yaml
requirements.txt
Makefile
```

小さいスターターでもアプリ本体は `src/<package>/` に置く。route が増えたら `web/routes.py` を分割し、業務ロジックは `services/` に逃がす。

## API 契約

- `GET /healthz`: process health。
- `GET /`: 最小 UI。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。

JSON API の成功レスポンス:

```json
{
  "data": {},
  "error": null
}
```

エラーレスポンス:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

## 設定

`.env.example` だけをコミットする。

```dotenv
APP_ENV=local
DATABASE_URL=sqlite:///./app.db
LOG_LEVEL=info
GCP_LOGGING_ENABLED=0
```

`.env`, `.env.*`, `secret.yaml`, `credentials.json`, `service-account.json`, 実 DB URL、実 GCP Project ID はコミットしない。

## 実装ルール

- route handler に SQL や外部 API 呼び出しを直接増やしすぎない。必要になったら service に分ける。
- Pydantic schema を request / response の境界に置く。
- DB session は dependency injection で渡す。
- startup 時に DB migration や重い初期化を勝手に実行しない。
- Jinja UI は最小に留め、複雑な SPA が必要になったら [react.md](../frontend/react.md) に分ける。
- Cloud Logging などのクラウド連携は helper に閉じ込め、ローカルでは無効にできるようにする。

## スターター対応

| スターター | 用途 |
|---|---|
| `starters/python/api-fastapi` | FastAPI + Jinja + SQLite の最小 CRUD |
| `starters/python/gcp` | GCS / BigQuery と連携する Python batch |
| `starters/python/ml` | ML experiment / artifact / metrics pipeline |
| `starters/python/batch` | 単純な Python batch |

## Makefile 例

```makefile
.PHONY: install run test clean

install:
	python3 -m pip install -r requirements.txt

run:
	PYTHONPATH=src python3 -m uvicorn micropost_api.main:app --reload --host 127.0.0.1 --port 8000

test:
	PYTHONPATH=src python3 -m pytest tests

clean:
	rm -rf src/*/__pycache__ tests/__pycache__ .pytest_cache
	rm -f app.db
```
