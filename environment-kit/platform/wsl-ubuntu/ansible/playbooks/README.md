# Playbooks

このディレクトリは WSL Ubuntu Ansible の実行入口です。

- `main.yml`
  - 新しい主入口。フル収束
- `check.yml`
  - 新しい状態検証入口
- `converge/`
  - base / user / runtime / container / cloud / data / security の中核導線
- `compat/`
  - 旧 `site*.yml` 系の互換導線

主入口の `main.yml` / `check.yml` は、`wsl_profile` と `execution_platform` に応じて
`group_vars/profiles/` と `group_vars/platform/` の上書きを読み込みます。
