# Project Skeleton Prompt

新規プロジェクトを AI コーディングしやすい形で作るための最小スケルトン生成プロンプト。

## 依頼文

```text
以下の構成で、新規プロジェクトの最小スケルトンを作成してください。

目的:
- AI と人間が同じ前提で作業できる
- 秘密情報をコミットしない
- 仕様、実装、運用のドキュメントを最初から分ける

作成する構成:

README.md
Makefile
CLAUDE.md
AGENTS.md
doppler.yaml
.gitignore

env/
  config.yaml
  secret.yaml

src/

tests/

doc/
  README.md
  01_仕様と設計.md
  02_移行ロードマップ.md
  03_実装カタログ.md
  04_運用.md

重要:
- env/secret.yaml は生成するが、.gitignore でコミット対象外にする
- .env / .env.* / credentials.json / service-account.json / *.tfvars / *.tfstate は ignore する
- README.md には起動方法、テスト方法、設定方法を最低限書く
- AGENTS.md には AI エージェントの作業ルールを書く
- doc/ 配下は見出しと更新ルールだけでよい
- 実 Project ID、実通知先、API key、token、個人情報は入れない
```

## 参考

生成用 CLI は [tools/project-generator](../../tools/project-generator/)。

ドキュメント雛形は [docs/templates/project-docs](../templates/project-docs/) を参照。
