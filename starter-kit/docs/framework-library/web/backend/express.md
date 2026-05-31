# Express API Blueprint

Node.js + Express で REST API を作る時の公開用ブループリント。

## 採用する場面

- Node.js の既存資産やミドルウェアを活かしたい。
- REST API を短期間で組みたい。
- フレームワークの自由度を残したい。

新規でエッジ配信や軽量 TypeScript API を優先するなら、まず [hono.md](./hono.md) を検討する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Runtime | Node.js 20 LTS 以上 |
| Language | TypeScript |
| Framework | Express 5 |
| Validation | Zod |
| Test | Vitest + Supertest |
| Lint / Format | ESLint + Prettier |
| Logging | pino |
| Config | dotenv for local only, environment variables in runtime |

## ディレクトリ

```text
src/
  app.ts
  server.ts
  config/
    env.ts
  middleware/
    error-handler.ts
    request-logger.ts
  routes/
    health.ts
    items.ts
  services/
    item-service.ts
  schemas/
    item-schema.ts
  types/
tests/
  health.test.ts
  items.test.ts
.env.example
package.json
tsconfig.json
```

## API 契約

- `GET /healthz`: process health。
- `GET /readyz`: DB や外部依存を含む readiness。外部依存がない場合は `healthz` と分けなくてよい。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。Zod で request body を検証する。

レスポンス形式:

```json
{
  "data": {},
  "error": null
}
```

エラー形式:

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
NODE_ENV=development
PORT=3000
DATABASE_URL=
LOG_LEVEL=info
```

`.env`, `.env.*`, `env/secret.yaml`, `credentials.json`, `service-account.json` はコミットしない。

## 実装ルール

- `server.ts` は listen だけ、`app.ts` は Express app 構築だけに分ける。
- route handler にビジネスロジックを書かない。
- 例外は共通 error middleware に集約する。
- DB 接続 URL や webhook URL のデフォルト実値をコードに埋め込まない。
- OpenAPI は外部公開 API の契約が必要な場合だけ追加する。

## Makefile 例

```makefile
.PHONY: install dev test lint build

install:
	npm ci

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

build:
	npm run build
```
