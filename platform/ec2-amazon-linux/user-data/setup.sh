#!/bin/bash
set -euxo pipefail

LOGFILE="/var/log/setup-env.log"
SWAP_FILE="/swapfile"
SWAP_SIZE_MB=2048

DOCKER_COMPOSE_VERSION="v2.24.5"
GO_VERSION="1.20.3"
TF_VERSION="1.4.6"
KUBECTL_VERSION="v1.26.3"
DUCKDB_VERSION="v0.10.2"

exec > >(tee -a "$LOGFILE") 2>&1

# ==============================
# 💻 基本セットアップ
# ==============================
function step_1_system_update { sudo dnf update -y; }

function step_2_swap_create {
  if [ ! -f "$SWAP_FILE" ]; then
    sudo dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$SWAP_SIZE_MB"
    sudo chmod 600 "$SWAP_FILE"
    sudo mkswap "$SWAP_FILE"
    sudo swapon "$SWAP_FILE"
    echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab
  fi
}

function step_4_dev_tools {
  sudo dnf groupinstall -y "Development Tools"
  sudo dnf install -y git make wget tar which python3 python3-pip python3-devel openssl-devel libffi-devel gzip jq npm unzip tree
}

# ==============================
# 🐳 Docker関連
# ==============================
function step_5_docker {
  sudo dnf install -y docker
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
}

function step_6_docker_compose {
  sudo mkdir -p /usr/libexec/docker/cli-plugins/
  sudo curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/libexec/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
  sudo -i -u ec2-user docker compose version || true
}

function step_19_docker_info { docker info || true; }

# ==============================
# ☁️ AWS・クラウド
# ==============================
function step_7_awscli { sudo dnf install -y awscli; }

function step_18_github_cli {
  type -p yum-config-manager >/dev/null || sudo dnf install -y yum-utils
  sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
  sudo dnf install -y gh
}

# ==============================
# 🐍 Node.js + Go + Rust
# ==============================
function step_8_nvm_node {
  sudo su - ec2-user -c "
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    echo 'export NVM_DIR=\"\$HOME/.nvm\"' >> ~/.bashrc
    echo '[ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"' >> ~/.bashrc
    source ~/.bashrc
    nvm install 18
    nvm alias default 18
    npm install -g nodemon
  "
}

function step_9_go {
  curl -LO "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
  sudo rm -rf /usr/local/go
  sudo tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
  rm -f "go${GO_VERSION}.linux-amd64.tar.gz"
  sudo tee /etc/profile.d/go.sh >/dev/null <<EOF
export GOROOT=/usr/local/go
export GOPATH=\$HOME/go
export PATH=\$PATH:\$GOROOT/bin:\$GOPATH/bin
EOF
  sudo chmod 644 /etc/profile.d/go.sh
  sudo mkdir -p /home/ec2-user/go
  sudo chown -R ec2-user:ec2-user /home/ec2-user/go
}

function step_10_rust { sudo dnf install -y rust cargo; }

# ==============================
# 🔧 IaC・その他ツール
# ==============================
function step_11_terraform {
  curl -LO "https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_amd64.zip"
  unzip "terraform_${TF_VERSION}_linux_amd64.zip"
  sudo mv terraform /usr/local/bin/
  sudo chmod +x /usr/local/bin/terraform
  rm -f "terraform_${TF_VERSION}_linux_amd64.zip"
}

function step_14_ansible {
  sudo -i -u ec2-user bash << 'EOF'
python3 -m pip install --user ansible
~/.local/bin/ansible --version || true
EOF
}

function step_15_duckdb {
  curl -L -o duckdb "https://github.com/duckdb/duckdb/releases/download/${DUCKDB_VERSION}/duckdb_cli-linux-amd64.zip"
  unzip -o duckdb -d /tmp/
  sudo mv /tmp/duckdb /usr/local/bin/duckdb
  sudo chmod +x /usr/local/bin/duckdb
}

# ==============================
# ☸️ Kubernetesツール群
# ==============================
function step_12_kubectl {
  curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
  sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
  rm -f kubectl
}

function step_16_helm {
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  helm version || true
}

function step_17_eksctl {
  curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
  sudo mv /tmp/eksctl /usr/local/bin
}

function step_21_k3s_install {
  curl -sfL https://get.k3s.io | sh -
  /usr/local/bin/k3s --version
  sudo systemctl status k3s --no-pager || true
}

function step_22_kubectl_completion {
  kubectl completion bash | sudo tee /etc/bash_completion.d/kubectl > /dev/null
  echo "source <(kubectl completion bash)" >> /home/ec2-user/.bashrc
}

function step_23_helm_plugins {
  helm plugin install https://github.com/databus23/helm-diff || true
  helm plugin list || true
}

function step_24_kind_install {
  curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
  chmod +x ./kind
  sudo mv ./kind /usr/local/bin/kind
  kind version || true
}

# ==============================
# 🎉 完了メッセージ
# ==============================
function final_message {
  echo "===== セットアップ完了！ ====="
  echo "主要なツール（Docker, AWS CLI, k3s, Helm, kind など）がインストールされました。"
  echo "再ログイン後に 'source ~/.bashrc' を実行すると補完も有効になります。"
}

# ==============================
# 🔁 実行順
# ==============================
step_1_system_update
step_2_swap_create
step_4_dev_tools
step_5_docker
step_6_docker_compose
step_7_awscli
step_8_nvm_node
step_9_go
# step_10_rust
step_11_terraform
step_12_kubectl
step_16_helm
step_17_eksctl
step_21_k3s_install
step_22_kubectl_completion
step_23_helm_plugins
step_24_kind_install
step_14_ansible
# step_15_duckdb
step_18_github_cli
step_19_docker_info

./check-versions.sh
final_message
