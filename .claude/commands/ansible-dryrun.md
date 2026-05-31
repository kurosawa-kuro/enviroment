---
description: WSL Ubuntu の Ansible プレイブックをドライラン（変更なし）で検証する
---
`platform/wsl-ubuntu/` の Ansible 構成を、システムに変更を加えずに検証してください。

手順:
1. `platform/wsl-ubuntu/` に降りて、文書化済みターゲット `make test`（= `ansible-playbook --check --diff` のドライラン）を実行する。
2. 失敗タスク・未定義変数・差分の要点を報告する。
3. Rust 追加分だけ確認したい場合は `make test-rust`（site-rust.yml の構文チェック）も使える。

注意:
- `make setup` / `make ansible-install` は **実機を変更する**ため、このコマンドでは実行しない。検証は必ずドライラン（`make test` / `*-syntax-check`）に閉じる。
- 文書化済みの Makefile ターゲットのみを使う（[CLAUDE.md](../../CLAUDE.md) の Command Execution Policy）。
