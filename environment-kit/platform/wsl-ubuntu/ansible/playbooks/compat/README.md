# compat playbooks

このディレクトリは旧 `site*.yml` 導線の互換レイヤです。新規運用では `playbooks/main.yml`、`playbooks/check.yml`、`playbooks/converge/` を優先します。

## 残している理由

- 既存の `make setup` / `site-*` 呼び出しを即時破壊しないため
- `config.yml` 駆動の選択式 UI をまだ profile へ完全移行していないため
- 段階的に非推奨化し、利用状況を見て縮退するため

## 現在の扱い

- `site.yml` / `site-base.yml` / `site-check.yml` / `site-rust.yml` / `site-user.yml`
  - 新しい主入口または converge playbook への薄い委譲
- `site-selective.yml`
  - `config.yml` 駆動の暫定 UI
- `site-parallel.yml`
  - 旧並列導線

正本の仕様・運用は `docs/wsl-ubuntu-ansible/` を参照する。
