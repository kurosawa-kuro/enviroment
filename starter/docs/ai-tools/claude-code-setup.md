# Claude Code Setup

Claude Code を starter-kit の開発母艦として使うための最小メモ。

## 前提

- Node.js / npm が利用できる
- リポジトリルートで `CLAUDE.md` と `AGENTS.md` を読む
- 秘密情報をコマンド出力やドキュメントへ貼らない

## インストール確認

```bash
claude --version
```

未インストールの場合は、公式手順に従って導入する。古いローカルパスや特定ユーザー名を前提にした削除コマンドは、このリポジトリの docs には固定しない。

## このリポジトリで見る順序

1. [../README.md](../README.md)
2. [../../README.md](../../README.md)
3. [../../AGENTS.md](../../AGENTS.md)
4. [../../CLAUDE.md](../../CLAUDE.md)
5. 対象スターターの `README.md` / `Makefile`

## 基本コマンド

```bash
git status --short
rg --files
git diff --check
```

スターター別の検証は [../guides/development-principles.md](../guides/development-principles.md) を参照。

## 運用ルール

- 変更前に周辺 README / Makefile を読む。
- 生成物や cache をコミット対象にしない。
- `.env`、`env/secret.yaml`、credential、token を読ませない。
- `docs/` を変えた場合、ルート README / AGENTS / CLAUDE との整合を見る。
- `starters/` と `optional/` の判断は [../STARTER-POLICY.md](../STARTER-POLICY.md) に従う。
