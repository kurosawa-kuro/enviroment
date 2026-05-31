# docs

starter-kit のドキュメント索引。

このディレクトリは、スターターの配置判断、共通作業ルール、参照ブループリント、生成先プロジェクト用テンプレートを置く場所。実装済みスターターの使い方は各 `starters/*/README.md` を一次情報にする。

## 一覧

| 場所 | 役割 |
|---|---|
| [STARTER-POLICY.md](./STARTER-POLICY.md) | `starters/` と `optional/` の配置判断 |
| [guides/](./guides/) | リポジトリ共通の開発ルール |
| [framework-library/](./framework-library/) | Web / ML framework 別の参照ブループリント |
| [database/](./database/) | PostgreSQL のローカル開発・運用メモ |
| [ai-tools/](./ai-tools/) | AI コーディング環境とエージェント運用メモ |
| [prompts/](./prompts/) | 新規プロジェクト作成用プロンプト |
| [templates/project-docs/](./templates/project-docs/) | 生成先プロジェクトへコピーする汎用ドキュメント雛形 |
| [task/](./task/) | project-generator の仕様メモ |
| [PUBLIC-RELEASE-CHECK.md](./PUBLIC-RELEASE-CHECK.md) | GitHub Public 公開前チェック |

## 権威順位

矛盾した場合は以下の順で正とする。

1. 実コード、`Makefile`、`package.json`、`Cargo.toml`
2. 各スターターの `README.md`
3. ルート [README.md](../README.md) / [CLAUDE.md](../CLAUDE.md) / [AGENTS.md](../AGENTS.md)
4. [STARTER-POLICY.md](./STARTER-POLICY.md)
5. その他の参照ドキュメント

`docs/templates/project-docs/` は starter-kit 本体の仕様ではない。新規プロジェクトにコピーして使うための雛形。

## 更新ルール

- スターターの追加・移動: ルート `README.md`、`CLAUDE.md`、`AGENTS.md`、`STARTER-POLICY.md` を確認する。
- project-generator の出力構成変更: `tools/project-generator/README.md`、`docs/task/`、`docs/templates/project-docs/` を確認する。
- 公開前ルール変更: `.gitignore`、`AGENTS.md`、関連 README を確認する。
- 古い個人案件のプロジェクト名、実パス、実通知先、実データは残さない。
