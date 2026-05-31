---
description: 対象スターターの品質ゲート（fmt / lint / test）を実行する
argument-hint: <starter-name> (例: rust-cli, terraform, batch)
---

スターター **$ARGUMENTS** の品質ゲートを実行してください。

## 手順

1. 対象ディレクトリを特定（`starters/$ARGUMENTS/`、無ければ `optional/$ARGUMENTS/`、
   `tools/$ARGUMENTS/`）。存在しなければ候補を提示して中断。

2. スタックを判定し、対応するチェックをそのディレクトリで実行:
   - **Rust**（`Cargo.toml`）: `make fmt && make clippy && make test`
     （Makefile が無ければ `cargo fmt && cargo clippy -- -D warnings && cargo test`）
   - **Terraform**（`*.tf`）: `terraform fmt -check -recursive && terraform validate`
     （必要なら `terraform init -backend=false`）
   - **Node/TS**（`package.json`）: `npm test`（必要なら先に `npm install`）
   - **Python**（`requirements.txt` / `pyproject.toml`）: `pytest`
     （venv が必要なら作成して `pip install -r requirements.txt`）

3. 失敗したら出力をそのまま示し、原因と修正案を簡潔に報告。全て通れば結果を要約。

コマンドは実際に実行して確認すること（推測で「通るはず」と書かない）。
