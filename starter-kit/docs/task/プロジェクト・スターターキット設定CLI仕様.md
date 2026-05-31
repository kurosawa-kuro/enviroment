# project-generator 仕様メモ

## 目的

新規プロジェクト作成時に、AI と人間が同じ前提で作業できる最小スケルトンを生成する。

実装本体は [tools/project-generator](../../tools/project-generator/)。

## 実装

- 言語: Rust
- バイナリ名: `starter`
- 既存ファイルはデフォルトで上書きしない
- テンプレートは `tools/project-generator/templates/` に置く

## 入力

作成先ディレクトリ。

```bash
starter /path/to/new-project
```

## 出力構成

```text
.gitignore
CLAUDE.md
AGENTS.md
Makefile
README.md
doppler.yaml
env/
  config.yaml
  secret.yaml
src/
doc/
  README.md
  01_仕様と設計.md
  02_移行ロードマップ.md
  03_実装カタログ.md
  04_運用.md
```

## secret.yaml と .gitignore

`env/secret.yaml` はローカル秘密情報の置き場として生成する。ただし、生成先プロジェクトでは `.gitignore` によりコミット対象外にする。

generator 自体のテンプレートに含まれる `templates/env/secret.yaml` は、公開してよいダミー内容だけにする。

`.gitignore` には最低限以下を含める。

```gitignore
.env
.env.*
!.env.example
env/secret.yaml
secret.yaml
secrets.yaml
credentials.json
service-account.json
*.pem
*.key
*.tfvars
*.tfstate
.terraform/
.doppler/
artifacts/
logs/
tmp/
```

## 挙動

1. 作成先パスを受け取る。
2. パスが存在しなければ作成する。
3. テンプレート構成を再現する。
4. 既存ファイルはスキップする。
5. 作成結果を表示する。

## エラー条件

- 作成先パスが未指定。
- 作成先ディレクトリを作成できない。
- テンプレートを読み込めない。
- ファイル作成に失敗した。

## 更新時の連動先

- `tools/project-generator/README.md`
- `tools/project-generator/templates/`
- `docs/templates/project-docs/`
- ルート `AGENTS.md`
