# PostgreSQL 開発ガイド

PostgreSQL を使うスターターや派生プロジェクト向けの最小方針。

## 基本方針

- ローカルは Docker Compose / Testcontainers / マネージド開発 DB のいずれかを使う。
- OS 直接インストールを前提にしない。
- 接続情報は `.env.example` だけ共有し、実 `DATABASE_URL` はコミットしない。
- マイグレーションを使う場合は、アプリコードと同じ変更で管理する。

## 配置判断

| 用途 | 推奨 |
|---|---|
| ローカルだけ | Docker Compose |
| CI の一時 DB | Testcontainers または一時 DB |
| 個人 PoC の共有 DB | Neon / Supabase などのブランチ可能な DB |
| 小規模本番 | Cloud SQL / RDS などのマネージド DB |
| Kubernetes ネイティブ必須 | CloudNativePG などの operator |

## 設定例

`.env.example`:

```dotenv
DATABASE_URL=postgres://app:changeme@localhost:5432/app
```

実パスワードや本番 URL は `.env` または secret manager に置く。

## スキーマ管理

採用する ORM / migration tool に合わせて 1 つに寄せる。

| Stack | 例 |
|---|---|
| Rust | sqlx migrate / refinery |
| Python | Alembic |
| Node / TypeScript | Prisma / Drizzle |
| Go | goose / atlas |

## 公開前チェック

- `DATABASE_URL` に実ホストや実パスワードが入っていない。
- seed / fixture に個人データや実ログが入っていない。
- dump、backup、`.sqlite`、`.db`、`.dump` をコミットしていない。
- README の接続例が `localhost` または明確なサンプル値。
