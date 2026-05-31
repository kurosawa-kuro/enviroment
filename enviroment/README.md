# enviroment

WSL Ubuntu、EC2 Ubuntu、Amazon Linux 向けの環境構築リポジトリです。Ansible、Makefile、補助スクリプトを使って、開発ツール、クラウド CLI、Docker、PostgreSQL などのセットアップを再現できるようにしています。

## 主な対象

- `platform/wsl-ubuntu/`
  - WSL Ubuntu 向けの Ansible ベース構成
- `platform/ec2-ubuntu/`
  - Ubuntu on EC2 と EKS 学習用構成
- `platform/ec2-amazon-linux/`
  - Amazon Linux 向けの user-data / セットアップスクリプト

## WSL Ubuntu クイックスタート

```bash
cd platform/wsl-ubuntu
make setup-ansible
make test-base
make setup-base
```

必要に応じて:

```bash
make setup-user
make setup
make test-rust
make setup-rust
```

詳細は以下を参照してください。

- [platform/wsl-ubuntu/README.md](./platform/wsl-ubuntu/README.md)
- [docs/wsl-ubuntu-ansible/初期WSL設定.md](./docs/wsl-ubuntu-ansible/初期WSL設定.md)

## PostgreSQL ポート方針

公開版では、ローカル PostgreSQL の競合を避けるため次のポート方針を採用しています。

| 用途 | ポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker PostgreSQL dev | `5433` |
| Docker PostgreSQL test | `5434` |
| Docker PostgreSQL dwh | `5435` |

## 公開ポリシー

- `.env` や `env/secret/` には実シークレットを置かない
- `env/config/setting.yaml` は非秘密の参照値のみを置く
- 秘密鍵、アクセストークン、Webhook URL、実クラウド認証情報はコミットしない
- 公開前に履歴も含めてシークレットスキャンを行う

## 補足

- Java と Kotlin はオプションであり、初期インストール既定ではありません
- Doppler は削除せず、必要に応じて安全な方法で認証情報を注入する前提です
