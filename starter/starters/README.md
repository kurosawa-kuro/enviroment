# Starters

正典スターターを用途別に管理するディレクトリ。

各スターターは独立して使えることを前提にし、最低限 `README.md`、`Makefile` または実行コマンド、公開してよいサンプル設定を持つ。

## 構成

| 場所 | 用途 |
|---|---|
| [rust/](./rust/) | Rust CLI / batch / API / fullstack |
| [python/](./python/) | Python batch / ML / GCP / FastAPI |
| [frontend/](./frontend/) | 静的 HTML / 管理画面 |
| [infra/](./infra/) | Terraform など IaC |

## 優先順

1. [rust/cli](./rust/cli/)
2. [rust/batch](./rust/batch/)
3. [rust/api-axum](./rust/api-axum/)
4. [rust/api-axum-fullstack](./rust/api-axum-fullstack/)
5. [python/batch](./python/batch/)
6. [python/ml](./python/ml/)
7. [python/gcp](./python/gcp/)
8. [python/api-fastapi](./python/api-fastapi/)
9. [infra/terraform](./infra/terraform/)
10. [frontend/admin-pico](./frontend/admin-pico/)
