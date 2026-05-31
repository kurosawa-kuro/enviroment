# Web Frameworks

このディレクトリは、Web framework 別の参照ブループリントを置く場所。

`starters/` に置くメイン級テンプレートとは役割を分ける。ここでは「そのフレームワークで作るなら、どの構成・境界・公開前ルールを採用するか」を短く固定する。

## 位置づけ

- 実装済みスターター: `starters/` を優先する。
- Web API / フロントエンドの比較検討: このディレクトリを見る。
- 古い個人アプリの移植: ここを基準に、秘密情報・個人設定・実データを落としてから作る。

## 共通方針

- `.env` / `secret.yaml` / 実クラウド設定 / 実通知先は公開しない。
- 共有する設定は `.env.example` または `config.example.yaml` に限定する。
- `env/secret.yaml` は生成先では `.gitignore` 対象にする。
- Doppler を使う場合も、Project 名・Config 名・Secret 名は公開用に一般化する。
- テストは最低限、health check / validation / main workflow を含める。
- Docker Compose は必要な場合だけ置く。DB ありきにしない。
- OpenAPI は公開 API 契約が必要な場合だけ採用する。必須扱いしない。

## 一覧

| 場所 | 用途 |
|---|---|
| [backend/](./backend/) | API backend framework |
| [frontend/](./frontend/) | SPA / frontend framework |

## 採用判断

| 要件 | 推奨 |
|---|---|
| Web API backend | [backend/](./backend/) |
| SPA / frontend | [frontend/](./frontend/) |
| 静的 HTML 管理画面 | `starters/frontend/admin-pico` |
