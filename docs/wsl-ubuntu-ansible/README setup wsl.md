# WSL 環境セットアップ — クイックスタート

WSL Ubuntu 環境を Ansible でセットアップするための最短導線。詳細は [01_仕様と設計.md](01_仕様と設計.md) / [03_実装カタログ.md](03_実装カタログ.md) / [04_運用.md](04_運用.md) を参照。

## 🚀 最短手順

すべて `platform/wsl-ubuntu/` 直下で実行する。

```bash
cd /home/ubuntu/repos/enviroment/platform/wsl-ubuntu

make setup-ansible   # Ansible / OpenSSH / make の初期導入
make setup-base      # WSL 基盤（locale / timezone / wsl.conf / Python・pipx・uv / Doppler）
make setup           # 標準セットアップ（config.yml 駆動）
make check           # 導入済みツールのバージョン/状態を確認
```

> 旧版にあった `make playbook` / `check-versions` は **存在しない**。上記の実在ターゲットを使う（一覧は `make help`）。

## ✨ make setup で入るもの（既定）

言語・ツールのバージョンは [`ansible/group_vars/all.yml`](../../platform/wsl-ubuntu/ansible/group_vars/all.yml) が単一の真実源。代表値:

- **言語**: Rust(stable) / Node.js(22.11.0) / Go(1.25.0) / Python(3.12.6)
  - 方針: ML=Python、非 ML=Rust。Node.js・Go は基盤ランタイム。**Java / Kotlin は opt-in（既定 OFF）**。
- **コンテナ / K8s**: Docker、kubectl(1.33.4)・helm(3.18.4)・kind(0.24.0)・minikube(1.35.0) ほか
- **クラウド**: gcloud（メイン）/ AWS CLI(2.28.10) / Terraform(1.12.2) / GitHub CLI(2.56.0)
- **DB**: PostgreSQL 15（ポート 5432）/ Neon CLI(neonctl)

## 📌 その他の導線

| やりたいこと | コマンド |
|---|---|
| 基盤だけ | `make setup-base` |
| ユーザー初期化（opt-in） | `make setup-user` |
| Rust だけ | `make setup-rust` |
| ドライラン（変更なし検証） | `make test` |
| 構文チェック | `make test-base` / `make test-rust` |

## 🔌 PostgreSQL ポート方針

| 用途 | ポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker dev / test / dwh | `5433` / `5434` / `5435` |

## 関連

- 初手（Windows 側 / Ubuntu 側）: [初期WSL設定.md](初期WSL設定.md)
- 運用の詳細: [04_運用.md](04_運用.md)
