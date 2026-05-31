# Frontend Frameworks

SPA / 管理画面 frontend の参照ブループリント。

## 一覧

| ファイル | 用途 |
|---|---|
| [react.md](./react.md) | React + Vite の SPA / 管理画面構成 |
| [vue.md](./vue.md) | Vue 3 + Vite のフロントエンド構成 |

## 採用判断

| 要件 | 推奨 |
|---|---|
| 管理画面・SPA・複雑な UI 状態 | React + Vite |
| 小さめの管理画面・学習コスト重視 | Vue 3 + Vite |
| 静的 HTML で足りる管理画面 | `starters/frontend/admin-pico` |

## 方針

- starter-kit の第一候補は大きな SPA ではなく、必要に応じて採用する。
- 実 API URL、Firebase / Supabase / Sentry project 情報は公開しない。
- `.env.example` だけをコミットし、`.env` と `.env.*` は除外する。
