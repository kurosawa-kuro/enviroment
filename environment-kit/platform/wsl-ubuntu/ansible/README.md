# Ansible 構成

`platform/wsl-ubuntu/ansible` は、WSL Ubuntu 環境を role 単位でセットアップするための本体です。

現行の仕様・運用・実装の正本は [`docs/wsl-ubuntu-ansible`](../../../docs/wsl-ubuntu-ansible/) 配下です。`ansible/docs/` は背景資料・旧設計アーカイブとして扱います。

## レイアウト

- `playbooks/`
  - 本体の入口 playbook 群
- `roles/` / `group_vars/` / `tasks/` / `inventory/`
  - 本番導線の中核
- `molecule/`
  - テスト scenario と Molecule 依存
- `support/`
  - 生成補助 playbook、テンプレート、補助ドキュメント
- `docs/`
  - 背景資料・旧設計アーカイブ

トップ直下には、実行時に常に使う `ansible.cfg` / `config.yml` / `requirements.yml` だけを残し、それ以外は責務別ディレクトリへ寄せる。

## プレイブック

- `playbooks/main.yml`
  - フルセットアップの主入口
- `playbooks/check.yml`
  - 導入済みツールの状態検証の主入口
- `playbooks/converge/`
  - domain ごとの中核導線
- `playbooks/compat/`
  - 旧 `site*.yml` 互換導線
- `molecule/`
  - Docker 一時環境での Molecule シナリオ群

## role

- `base`
  - WSL 基盤設定、基本パッケージ、locale、timezone、`/etc/wsl.conf`、uv、Doppler
- `cache`
  - ダウンロードキャッシュ、APT キャッシュ、共通作業ディレクトリの事前準備
- `user-bootstrap`
  - Git / bashrc / `.ssh` の opt-in 初期化
- `development-runtime`
  - Rust、Node.js、Go、オプションの Java / Kotlin
- `docker`
  - Docker Engine
- `kubernetes`
  - 既定は kubectl / kind / helm / kustomize の最小構成。node 系や補助ツールは opt-in
- `security`
  - trivy、kube-bench、kube-hunter、kubescape、auditd、apparmor-utils
- `aws`
  - AWS CLI、Terraform、GitHub CLI
- `gcp`
  - Google Cloud CLI
- `postgresql`
  - apt PostgreSQL、拡張、Neon CLI

## 主要変数

- `group_vars/all.yml`
  - バージョンや既定値のベースレイヤ
- `group_vars/profiles/`
  - `full` / `minimal` / `runtime` / `ci` の profile 上書き
- `group_vars/platform/`
  - `wsl` / `molecule` の platform 上書き
- `group_vars/domains/`
  - `core` / `runtime` / `container` / `security` / `cloud` / `data` / `user` の domain 別変数
- `config.yml`
  - 選択式セットアップ用の有効 / 無効スイッチ
- `env/config/setting.yaml`
  - Git の `user.name` / `user.email` / 既定 branch の共有設定
- `molecule/requirements-molecule.txt` / `molecule/requirements-molecule.yml`
  - Molecule 実行に必要な Python 依存と Ansible collection
- `support/generate-requirements.yml`
  - `requirements.yml` の生成補助 playbook

## ポート方針

| 用途 | ポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker PostgreSQL dev | `5433` |
| Docker PostgreSQL test | `5434` |
| Docker PostgreSQL dwh | `5435` |

## 補足

- `main.yml` / `check.yml` は `wsl_profile` と `execution_platform` で変数レイヤを切り替えます
- `Makefile` からは `PROFILE=full|minimal|runtime|ci`、`PLATFORM=wsl|molecule` を渡せます
- `gcloud` は `latest` を使います
- Java / Kotlin は既定では入れません
- ユーザー固有設定は `user-bootstrap` を有効化した場合のみ反映します
- Molecule では systemd / timezone / locale のホスト依存処理を抑制し、role の回帰検知を優先します
