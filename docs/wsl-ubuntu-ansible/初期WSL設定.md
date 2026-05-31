# 初期WSL設定

このドキュメントは、Windows 側で最初にやることと、Ubuntu 側でこのリポジトリの Ansible に任せることを分けて整理したものです。

## 1. Windows 側で人がやること

### WSL 更新

```powershell
wsl --update
wsl --version
wsl --set-default-version 2
```

### 必要に応じた停止

```powershell
wsl --shutdown
```

### `.wslconfig`

`C:\Users\<ユーザー名>\.wslconfig`

```ini
[wsl2]
memory=16GB
processors=8
swap=8GB
localhostForwarding=true
```

### GitHub 公開鍵登録

SSH 鍵生成までは Ubuntu 側でできますが、GitHub 画面への公開鍵登録は手動です。

## 2. Ubuntu 側で最初にやること

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  unzip \
  zip \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common \
  apt-transport-https \
  jq \
  tree \
  htop \
  net-tools \
  dnsutils \
  iproute2 \
  make \
  pkg-config
```

リポジトリは Linux 側に置きます。

```bash
mkdir -p ~/repos
cd ~/repos
git clone <YOUR_REPOSITORY_URL> enviroment
```

## 3. ここから先は Ansible に寄せる

```bash
cd /home/ubuntu/repos/enviroment/platform/wsl-ubuntu
make setup-ansible
make test-base
make setup-base
```

`setup-base` で主に次を入れます。

- locale: `ja_JP.UTF-8`
- timezone: `Asia/Tokyo`
- `/etc/wsl.conf`
- Python / pipx / uv
- Git / jq / htop / make などの基礎ツール
- Doppler

## 4. opt-in のユーザー初期化

ユーザー固有設定を入れたい場合だけ実行します。

```bash
cd /home/ubuntu/repos/enviroment/platform/wsl-ubuntu
make setup-user
```

対象:

- `~/.ssh` ディレクトリ権限
- `~/.gitignore_global`
- Git 共通設定
- `~/.bashrc` の最小 PATH / alias

Git の `user.name` / `user.email` は推測しません。必要なら Ansible 変数で与えてください。

## 5. 標準セットアップ

```bash
cd /home/ubuntu/repos/enviroment/platform/wsl-ubuntu
make setup
```

主な導入対象:

- Rust
- Node.js
- Go
- Docker
- Kubernetes ツール群
- Google Cloud CLI (`gcloud`)
- AWS CLI / Terraform / GitHub CLI
- PostgreSQL

補足:

- Java はオプション
- Kotlin はオプション
- 既定の初期インストールには含めません

## 6. Rust 単体導線

```bash
cd /home/ubuntu/repos/enviroment/platform/wsl-ubuntu
make test-rust
make setup-rust
```

## 7. PostgreSQL ポート方針

WSL apt PostgreSQL と Docker PostgreSQL はポートを分離します。

| 用途 | ポート |
|---|---|
| WSL apt PostgreSQL | `5432` |
| Docker PostgreSQL dev | `5433` |
| Docker PostgreSQL test | `5434` |
| Docker PostgreSQL dwh | `5435` |

## 8. `.env` / `env/` の扱い

- `.env`
  - ローカル接続用の代表値を置く
- `env/config/setting.yaml`
  - 非秘密の設定だけを置く
- `env/secret/credential.yaml`
  - パスワードや API key などの秘密を置く

秘密は `setting.yaml` に置かない前提です。

## 9. 未対応 / 手動候補

- `session-manager-plugin`
- Windows 側 `.wslconfig` の自動生成
- GitHub 画面操作を伴う設定
