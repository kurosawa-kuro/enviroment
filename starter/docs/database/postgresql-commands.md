# PostgreSQL コマンド集

ローカル開発でよく使う確認コマンド。

## psql

```bash
psql "$DATABASE_URL"
```

よく使う psql コマンド:

| コマンド | 説明 |
|---|---|
| `\l` | database 一覧 |
| `\c DB_NAME` | database 切り替え |
| `\dt` | table 一覧 |
| `\d TABLE_NAME` | table 定義 |
| `\du` | role 一覧 |
| `\q` | 終了 |

## Docker Compose

```bash
docker compose ps
docker compose logs postgres
docker compose exec postgres psql -U app -d app
```

## 基本 SQL

```sql
SELECT current_database();
SELECT current_user;
SELECT version();

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## 接続確認

```bash
pg_isready -d "$DATABASE_URL"
```

## 注意

- 実 `DATABASE_URL` を docs に貼らない。
- dump や backup はリポジトリに置かない。
- OS 直接インストールの service 名や PostgreSQL version を固定しない。
