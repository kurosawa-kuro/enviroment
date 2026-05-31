# Playbooks

このディレクトリは WSL Ubuntu Ansible 本体の入口 playbook 群です。

- `site.yml`
  - フルセットアップ
- `site-base.yml`
  - WSL 基盤のみ
- `site-selective.yml`
  - `config.yml` 駆動の選択式セットアップ
- `site-user.yml`
  - opt-in のユーザー初期化
- `site-rust.yml`
  - Rust 単体導線
- `site-check.yml`
  - 状態検証
- `site-parallel.yml`
  - フェーズ分割実行
