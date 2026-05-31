---
description: WSL Ubuntu の Ansible プレイブック/ロール YAML を構文チェックする
---
`platform/wsl-ubuntu/ansible/` 配下のプレイブックと変更済み YAML を構文検証してください。

手順:
1. `platform/wsl-ubuntu/ansible/` で `ansible-playbook site.yml --syntax-check` を実行し、エラー無く解決することを確認する。
2. 必要に応じて `site-rust.yml` 等、個別プレイブックも `--syntax-check` する。
3. 変更した `group_vars/*.yml` や `roles/*/tasks/*.yml` は YAML としてパース可能か確認する（PostToolUse フックでも自動検証されるが、まとめて確認したい場合に使う）。
4. 既知の不備: `site-selective.yml` は Rust 追加とは無関係に `tasks/nodejs` 等の不足で失敗する。これは事前から存在する問題として扱い、勝手に新規ファイルを作って塞がない（指示があれば対応）。

注意:
- `--syntax-check` は変更を加えない安全な操作。実適用（apply）はしない。
