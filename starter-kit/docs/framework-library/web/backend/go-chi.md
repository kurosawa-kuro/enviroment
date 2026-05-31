# Go chi API Blueprint

Go + chi で標準ライブラリ寄りの HTTP API を作る時の公開用ブループリント。

## 採用する場面

- Go の `net/http` に近い薄いルーターを使いたい。
- 小中規模 API をシンプルに保ちたい。
- ミドルウェアや handler の依存を明示的に管理したい。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Go 1.22 以上 |
| Router | github.com/go-chi/chi/v5 |
| Validation | request DTO + explicit validation |
| Test | testing + httptest |
| Logging | slog |
| Config | environment variables |

## ディレクトリ

```text
cmd/api/
  main.go
internal/
  config/
    config.go
  httpapi/
    server.go
    routes.go
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

エラー形式:

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
APP_ENV=development
PORT=8080
DATABASE_URL=
LOG_LEVEL=info
```

`.env.example` だけコミットする。`secret.yaml` やクラウド認証ファイルは置かない。

## 実装ルール

- `cmd/api/main.go` は依存の組み立てと起動だけにする。
- `internal/httpapi` に HTTP 境界を閉じ込める。
- service 層は `http.Request` や chi の型に依存させない。
- context timeout を外部 I/O に必ず渡す。
- OpenAPI は必要になった時だけ追加する。

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
