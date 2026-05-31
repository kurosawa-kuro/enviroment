# 初期WSL設定

この文書は「Windows 側と Ubuntu 側で最初に何をやるか」だけを抜き出した実務メモです。  
設計、実装一覧、日常運用の詳細は 01〜04 を正本としてください。

## 参照先

- 仕様 / 設計: [01_仕様と設計.md](01_仕様と設計.md)
- 実装一覧: [03_実装カタログ.md](03_実装カタログ.md)
- 運用手順: [04_運用.md](04_運用.md)

## 1. Windows 側で最初にやること

```powershell
wsl --update
wsl --version
wsl --set-default-version 2
```

必要に応じて停止:

```powershell
wsl --shutdown
```

`.wslconfig` の例:

```ini
[wsl2]
memory=16GB
processors=8
swap=8GB
localhostForwarding=true
```

GitHub への SSH 公開鍵登録は手動です。

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

リポジトリは Linux 側に clone します。

```bash
mkdir -p ~/repos
cd ~/repos
git clone <YOUR_REPOSITORY_URL> private-kit
```

## 3. その後の最短導線

```bash
cd /home/ubuntu/repos/private-kit/environment-kit/platform/wsl-ubuntu
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

## 4. この文書で扱わないもの

- role / playbook / 変数の全一覧
- 改善提案の進捗
- 並列導線や詳細なトラブルシュート

それらは [03_実装カタログ.md](03_実装カタログ.md) と [04_運用.md](04_運用.md) を参照してください。
