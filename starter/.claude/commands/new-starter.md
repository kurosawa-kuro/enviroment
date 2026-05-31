---
description: 規約どおりに新しいスターターを starters/ へ追加する
argument-hint: <name> <用途の説明>
---

新しいスターター **$ARGUMENTS** を、このリポジトリの規約に従って追加してください。

## 手順

1. **配置先の判断**
   - 通常のスターター（Rust / Python / Terraform / バッチ等）は `starters/<name>/` に作成。
   - フロントエンド主体（React / Next.js 等）やレガシー多言語は `starters/` ではなく
     `optional/` に置く（[docs/STARTER-POLICY.md](../../docs/STARTER-POLICY.md) のフロント方針に従う）。

2. **最小ファイルを作成**（既存スターターの作法に合わせる）
   - `Makefile` … 標準ターゲット: `help` / `setup` / `build` / `run` / `test` / `fmt` /
     `lint`(または `clippy`) / `clean`。`help` は `grep -E '^[a-zA-Z_-]+:.*?## '` 方式。
   - `README.md` … 用途・使い方（make コマンド例）・構成図。
   - `.gitignore` … スタックに応じた成果物除外。
   - 最小ソース（例: Rust なら `Cargo.toml` + `src/main.rs`）。
   - 参考実装: [starters/rust-cli](../../starters/rust-cli/),
     [starters/rust-batch](../../starters/rust-batch/),
     [starters/terraform](../../starters/terraform/)。

3. **登録**
   - ルート [README.md](../../README.md) のスターター一覧表に行を追加。
   - [CLAUDE.md](../../CLAUDE.md) の Project Structure に 1 行追加。

4. **検証**
   - 雛形が動くことを実際に実行して確認（例: `cargo run -- --help` / `terraform validate` /
     `npm test`）。推測で終わらせない。

作成後、追加したファイルと登録箇所を一覧で報告してください。
