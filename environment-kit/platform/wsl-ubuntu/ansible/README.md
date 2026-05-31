# Ansible 構成

`platform/wsl-ubuntu/ansible` は、WSL Ubuntu 環境を role 単位でセットアップするための本体です。

現行の仕様・運用・実装の正本は [`docs/wsl-ubuntu-ansible`](../../../docs/wsl-ubuntu-ansible/) 配下です。`ansible/docs/` は背景資料・旧設計アーカイブとして扱います。

## プレイブック

- `site.yml`
  - フルセットアップ
- `site-selective.yml`
  - `config.yml` に基づく選択式セットアップ
- `site-base.yml`
  - WSL 基盤設定のみ
- `site-user.yml`
  - opt-in のユーザー初期化のみ
- `site-rust.yml`
  - Rust 専用導線
- `site-check.yml`
  - 導入済みツールの状態検証
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
  - バージョンや WSL 基盤設定のシングルソース
- `config.yml`
  - 選択式セットアップ用の有効 / 無効スイッチ
- `env/config/setting.yaml`
  - Git の `user.name` / `user.email` / 既定 branch の共有設定
- `requirements-molecule.txt` / `requirements-molecule.yml`
  - Molecule 実行に必要な Python 依存と Ansible collection

## ポート方針

| 用途 | ポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker PostgreSQL dev | `5433` |
| Docker PostgreSQL test | `5434` |
| Docker PostgreSQL dwh | `5435` |

## 補足

- `gcloud` は `latest` を使います
- Java / Kotlin は既定では入れません
- ユーザー固有設定は `user-bootstrap` を有効化した場合のみ反映します
- Molecule では systemd / timezone / locale のホスト依存処理を抑制し、role の回帰検知を優先します
