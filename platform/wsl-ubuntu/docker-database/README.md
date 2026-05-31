# Docker Database

WSL apt PostgreSQL と競合しないように、Docker 側の PostgreSQL は別ポートで起動します。

## ポート方針

| 用途 | ホストポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker PostgreSQL dev | `5433` |
| Docker PostgreSQL test | `5434` |
| Docker PostgreSQL dwh | `5435` |

## よく使うコマンド

```bash
make start-db
make start-db-local
make start-db-test
make start-db-dwh
make stop-db
```

## DB 名

- dev: `dev_local`
- test: `dev_test`
- dwh: `dev_dwh`

## 接続サンプル

`node-pg/connect.js` は Docker の dev DB に接続する設定です。

- host: `localhost`
- port: `5433`
- database: `dev_local`

## 補足

- apt で入る PostgreSQL は `platform/wsl-ubuntu/ansible/roles/postgresql/` 側で管理します
- Docker 側はローカル検証用に dev / test / dwh を分離しています
