# Vue 3 Frontend Blueprint

Vue 3 + Vite で管理画面や小規模 SPA を作る時の公開用ブループリント。

## 採用する場面

- API と接続する管理画面を軽く作りたい。
- Vue の Composition API と Pinia で状態を整理したい。
- Next / Nuxt ほどの SSR やルーティング機能は不要。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Runtime | Node.js 20 LTS 以上 |
| Framework | Vue 3 |
| Build | Vite |
| Language | TypeScript |
| Router | Vue Router |
| State | Pinia |
| HTTP | fetch wrapper or Axios |
| Test | Vitest + Testing Library |
| Style | existing design system first, otherwise CSS modules or Tailwind |

## ディレクトリ

```text
src/
  main.ts
  App.vue
  app/
    router.ts
    query-client.ts
  components/
    ui/
  features/
    items/
      api.ts
      components/
      pages/
      store.ts
      types.ts
  layouts/
    AppLayout.vue
  pages/
    DashboardPage.vue
    NotFoundPage.vue
  shared/
    config.ts
    errors.ts
    http.ts
tests/
.env.example
index.html
package.json
vite.config.ts
```

## 画面構成

- `/`: ダッシュボードまたは一覧。
- `/items`: 一覧と検索。
- `/items/:id`: 詳細。
- `/settings`: 公開してよいローカル設定だけ。

本番通知先、Webhook、個人監視対象、実ログは画面にも fixture にも含めない。

## 設定

Vite の公開 env は `VITE_` prefix が付くため、秘密情報を入れない。

```dotenv
VITE_APP_NAME=Starter App
VITE_API_BASE_URL=http://localhost:8080
```

API key、token、cookie、Doppler token、クラウド Project ID はフロントエンド env に置かない。

## 実装ルール

- feature 単位で API / type / page / store をまとめる。
- `shared/http.ts` で API error を統一する。
- 画面に実個人データや実通知先をハードコードしない。
- fixture はダミーデータだけにする。
- UI は最初の画面から実用画面にする。説明だけの landing page にしない。
- E2E が必要な時だけ Playwright を追加する。

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
