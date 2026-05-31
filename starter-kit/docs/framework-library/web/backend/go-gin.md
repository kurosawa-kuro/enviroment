# Go Gin API Blueprint

Go + Gin で Web API を作る時の公開用ブループリント。

## 採用する場面

- Gin の binding / middleware / ecosystem を使いたい。
- API サーバーとしての定番構成を早く組みたい。
- chi よりフレームワーク機能を多めに使いたい。

薄く保ちたい場合は [go-chi.md](./go-chi.md) を優先する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Go 1.22 以上 |
| Framework | github.com/gin-gonic/gin |
| Validation | Gin binding + explicit validation |
| Test | testing + httptest |
| Logging | slog or zap |
| Config | environment variables |

## ディレクトリ

```text
cmd/api/
  main.go
internal/
  config/
    config.go
  httpapi/
    router.go
    handlers/
      health.go
      items.go
    middleware/
      errors.go
      logging.go
  item/
    service.go
    model.go
tests/
.env.example
go.mod
Makefile
```

## API 契約

- `GET /healthz`: process health。
- `GET /readyz`: 外部依存の readiness。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。

成功レスポンス:

```json
{
  "data": {}
}
```

エラーレスポンス:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

## 設定

```dotenv
GIN_MODE=debug
PORT=8080
DATABASE_URL=
LOG_LEVEL=info
```

実 DB URL、Webhook、クラウド Project ID はコミットしない。

## 実装ルール

- Gin の `Context` は handler 境界で止める。
- service 層は Gin に依存させない。
- middleware は logging / recovery / error shaping に絞る。
- validation error はレスポンス形式を統一する。
- OpenAPI 生成は公開 API 契約が必要な時だけ追加する。

## Makefile 例

```makefile
.PHONY: run test fmt vet build

run:
	go run ./cmd/api

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

build:
	go build -o bin/api ./cmd/api
```
