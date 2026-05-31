# Rust Axum API Starter

通常 API の第一候補にする Rust + axum スターター。

`/api/health` と基本 API のテストを持つ、最小構成の HTTP API。

## 構成

```text
src/
  main.rs
  lib.rs
tests/
  api_test.rs
env/
  config.yaml
docker/
  Dockerfile
  docker-compose.yml
```

## コマンド

```bash
make build
make run
make test
make fmt
make lint
```

## 起動

```bash
PORT=8080 make run
```

確認:

```bash
curl http://127.0.0.1:8080/api/health
```

## Docker

```bash
make docker
```

停止:

```bash
make docker-down
```

## 公開安全

- `env/config.yaml` は公開してよい一般設定だけにする。
- 実 secret、token、DB URL はコードや `env/config.yaml` に埋め込まない。
- 秘密情報が必要になったら `env/secret.yaml` や `.env` を使い、コミットしない。
- `target/` と coverage はコミットしない。
- 環境ごとの実値は `.env` や secret manager で扱う。
