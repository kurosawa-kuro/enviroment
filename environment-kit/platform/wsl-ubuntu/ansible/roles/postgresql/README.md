# postgresql role

WSL 側 PostgreSQL、拡張、DB 初期化、Neon CLI を導入する data role。

## Inputs

- `postgres_version`
- `postgres_port`
- `postgres_user`
- `postgres_password`
- `postgres_db_local`
- `postgres_db_test`
- `postgres_extensions`
- `neonctl_version`
- `postgresql_manage_service`
- `validate_installation`

## Dependencies

- `base`
- `node` / `npm` が `neonctl` 用に必要

## Outputs

- PostgreSQL server/client
- `local_dev`, `local_test`
- PostGIS / `pgcrypto` / `uuid-ossp`
- `neonctl`

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `data`
- Molecule `postgresql`
