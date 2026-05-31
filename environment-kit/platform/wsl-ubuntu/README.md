# WSL Ubuntu Environment Setup

## 概要

このディレクトリは、WSL Ubuntu 環境を Ansible で再現可能に整えるためのセットアップ資産です。Ubuntu / WSL 内で完結する設定はできるだけ Ansible 化し、Windows 側の `.wslconfig` や GitHub 画面操作のような外部依存は手動のまま残します。

## 方針

- ML 系は Python
- 非 ML 系は Rust
- GCP は `gcloud` をメインクラウドとして扱う
- AWS CLI / Terraform / GitHub CLI は温存
- Doppler は維持
- Java / Kotlin はオプションで、初期インストール既定には含めない

## クイックスタート

```bash
# 初回準備
make setup-ansible

# WSL 最小セットアップ導線
make test-base
make setup-base

# opt-in のユーザー初期化
make setup-user

# config.yml ベースの選択式セットアップ
make setup

# Rust だけ個別確認
make test-rust
make setup-rust

# 検証
make check
```

## 主な導入対象

### base

- WSL 基盤パッケージ
- locale: `ja_JP.UTF-8`
- timezone: `Asia/Tokyo`
- `/etc/wsl.conf`
- Python / pipx / uv
- Git / Curl / Wget / jq / htop / make / unzip / zip
- Doppler

### user-bootstrap

opt-in のみで適用します。

- `~/.ssh` ディレクトリ権限
- `~/.gitignore_global`
- Git 共通設定
- `~/.bashrc` の最小 alias / PATH

### development-runtime

- Rust
- Node.js
- Go
- Java / Maven / Gradle はオプション
- Kotlin はオプション

### docker / kubernetes / cloud / postgresql

- Docker
- Kubernetes ツール群
- Google Cloud CLI (`gcloud`)
- AWS CLI / Terraform / GitHub CLI
- PostgreSQL

## PostgreSQL ポート方針

apt で入る WSL 側 PostgreSQL と Docker PostgreSQL はポートを分離します。

| 用途 | ポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker PostgreSQL dev | `5433` |
| Docker PostgreSQL test | `5434` |
| Docker PostgreSQL dwh | `5435` |

## 重要ファイル

- `Makefile`
- `ansible/site.yml`
- `ansible/site-base.yml`
- `ansible/site-user.yml`
- `ansible/site-rust.yml`
- `ansible/site-selective.yml`
- `ansible/group_vars/all.yml`
- `ansible/config.yml`

## 手動のまま残すもの

- `wsl --update`
- `wsl --set-default-version 2`
- Windows 側 `.wslconfig`
- GitHub への SSH 公開鍵登録

## 未対応 / 手動候補

- `session-manager-plugin`
- Windows 側設定ファイルの自動生成
- 既存外部サービスの認証投入
