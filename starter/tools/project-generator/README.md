# project-generator

新規プロジェクト用の標準スケルトンを生成する Rust 製 CLI。

バイナリ名は `starter`、パッケージ名は `starter-cli`。

## 使い方

```bash
cd tools/project-generator
cargo run -- /path/to/new-project
```

既存ファイルを上書きする場合だけ `--force` を付ける。

```bash
cargo run -- /path/to/new-project --force
```

生成先ディレクトリが存在しない場合は作成する。既存ファイルはデフォルトでスキップし、`--force` 指定時のみ上書きする。

## 生成されるもの

```text
.
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── Makefile
├── README.md
├── doppler.yaml
├── env/
│   ├── config.yaml
│   └── secret.yaml
├── src/
└── doc/
    ├── README.md
    ├── 01_仕様と設計.md
    ├── 02_移行ロードマップ.md
    ├── 03_実装カタログ.md
    └── 04_運用.md
```

## テンプレート構成

テンプレートは `tools/project-generator/templates/` に置く。`secret.yaml` と `.gitignore` は初期構成に必ず含める。

```text
templates/
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── Makefile
├── README.md
├── doppler.yaml
├── env/
│   ├── config.yaml
│   └── secret.yaml
├── doc_01.md
├── doc_02.md
├── doc_03.md
├── doc_04.md
└── doc_README.md
```

出力ファイルの対応は `src/scaffold.rs` の `FILES` で管理する。
`templates/env/.gitignore` はテンプレート管理用で、生成対象には含めない。

## .gitignore の方針

生成される `.gitignore` は、コミット事故を防ぐために最初から入れる。

- コミットしない: `.env`, `.env.*`, `target/`, `node_modules/`, `dist/`, `build/`, `__pycache__/`, `*.pyc`, `*.db`, `*.sqlite3`, `coverage/`
- コミットしない: `env/secret.yaml`, `env/secret.*.yaml`
- コミットしてよい: `.env.example`, `.env.sample`, `.env.template`, `env/secret.example.yaml`
- 非機密の設定は `env/config.yaml`、ローカル秘密情報は `env/secret.yaml`、チーム共有・本番秘密情報は Doppler に置く

生成後に `git status --short --ignored` を見て、実行時生成物が `!!` 側に落ちていることを確認する。

## 開発

```bash
cd tools/project-generator
cargo fmt
cargo test
cargo run -- /tmp/starter-sandbox
```

CLI 自身のビルド成果物は `tools/project-generator/target/` に出る。リポジトリ直下の `.gitignore` で ignore されるため、コミット対象にしない。

## 変更時の確認

テンプレートを変更したら、最低限これを確認する。

```bash
cd tools/project-generator
cargo fmt
cargo test
cargo run -- /tmp/starter-sandbox --force
git -C /tmp/starter-sandbox status --short --ignored
```

`.gitignore` テンプレートを変更した場合は、`.env.example`、`.env.sample`、`env/secret.example.yaml` が追跡可能なままかも確認する。
