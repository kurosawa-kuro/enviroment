# Hono API Blueprint

TypeScript + Hono で軽量 API を作る時の公開用ブループリント。

## 採用する場面

- TypeScript で小さく速い API を作りたい。
- Cloudflare Workers / Bun / Node.js など複数ランタイムを視野に入れたい。
- OpenAPI よりも型安全な handler と validation を優先したい。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Runtime | Node.js 20 LTS 以上、または Workers / Bun |
| Language | TypeScript |
| Framework | Hono |
| Validation | zValidator + Zod |
| Test | Vitest |
| Lint / Format | ESLint + Prettier |
| Config | runtime environment variables |

## ディレクトリ

```text
src/
  index.ts
  app.ts
  config/
    env.ts
  routes/
    health.ts
    items.ts
  services/
    item-service.ts
  schemas/
    item-schema.ts
  middleware/
    error-handler.ts
tests/
  health.test.ts
  items.test.ts
.env.example
package.json
tsconfig.json
```

## API 契約

- `GET /healthz`: process health。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。

成功レスポンス:

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

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=
LOG_LEVEL=info
```

`.env.example` 以外はコミットしない。Workers などに載せる場合も、実 Project 名・Account ID・Secret 名は公開用に一般化する。

## 実装ルール

- `app.ts` に route mount と middleware を集約する。
- `index.ts` は runtime adapter の入口に限定する。
- `Context` に直接秘密情報を持たせない。
- Zod schema を API 入出力の単一の根にする。
- DB なしの最小 API から始め、必要になった時だけ Drizzle / Prisma などを追加する。

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
