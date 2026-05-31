# React Frontend Blueprint

React でフロントエンドを作る時の公開用ブループリント。

この starter-kit では、`admin-pico` は静的 HTML 管理画面スターターであり、React スターターではない。React を採用する場合は、管理画面・SPA・フルスタック UI の設計基準としてこの文書を使う。

## 採用する場面

- UI 状態が多く、コンポーネント分割と再利用が必要。
- 管理画面、ダッシュボード、検索・一覧・編集の反復操作が中心。
- API と分離した SPA として配信したい。
- Next.js などのフルスタック framework に入る前に、Vite ベースの薄い構成で始めたい。

単純な静的管理画面で十分なら、`starters/frontend/admin-pico` を優先する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Runtime | Node.js 20 LTS 以上 |
| Language | TypeScript |
| Framework | React 19 系 |
| Build | Vite |
| Routing | React Router |
| Data Fetching | TanStack Query |
| Form | React Hook Form + Zod |
| Test | Vitest + Testing Library |
| E2E | Playwright |
| Lint / Format | ESLint + Prettier |
| Styling | CSS Modules / Tailwind CSS / design system のいずれか |

## ディレクトリ

```text
src/
  main.tsx
  app/
    App.tsx
    router.tsx
  pages/
    DashboardPage.tsx
    ItemsPage.tsx
    ItemEditPage.tsx
  features/
    items/
      api.ts
      schema.ts
      components/
      hooks.ts
  shared/
    api/
      client.ts
    ui/
    config/
      env.ts
tests/
  items.test.tsx
e2e/
  dashboard.spec.ts
.env.example
package.json
vite.config.ts
```

## 画面設計

- 最初の画面は実際に使う dashboard / list / editor にする。
- SaaS / 管理画面は密度を高め、情報を比較しやすくする。
- 一覧、詳細、編集、空状態、エラー状態、ローディング状態を最初から揃える。
- 画面説明文を増やすより、検索、filter、pagination、保存、取消、再試行を実装する。
- UI の文言に個人の監視対象、通知先、実運用名を入れない。

## API 契約

frontend 側では API response を schema で検証する。

```json
{
  "data": {},
  "error": null
}
```

エラー:

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
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_APP_ENV=local
```

`.env`, `.env.*`, 実 API URL、実 Firebase / Supabase / Cloudflare / Sentry project 情報は公開しない。公開用 README では `example.com` や dummy project 名にする。

## 実装ルール

- `pages/` は routing 単位、`features/` は業務機能単位、`shared/` は横断部品に限定する。
- API client は 1 箇所に集約し、component から直接 `fetch` しない。
- form schema と API schema を分ける。画面入力と backend DTO を混同しない。
- token を localStorage に置く設計は公開スターターでは避ける。必要なら HttpOnly cookie 前提で書く。
- React Server Components や framework 固有機能は、Next.js などを採用する時だけ使う。
- デザイン system がない場合も、button / input / table / dialog / toast は `shared/ui` に寄せる。

## Makefile 例

```makefile
.PHONY: install dev test e2e lint build clean

install:
	npm ci

dev:
	npm run dev

test:
	npm test

e2e:
	npm run e2e

lint:
	npm run lint

build:
	npm run build

clean:
	rm -rf dist coverage
```
