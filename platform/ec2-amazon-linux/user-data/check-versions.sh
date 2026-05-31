#!/bin/bash

set -euo pipefail
trap 'echo "エラーが発生しました: $?" >&2' ERR

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_command() {
    command -v "$1" &>/dev/null
}

check_versions() {
    log "インストール済みのコンポーネントバージョンを確認します..."

    #==============================
    # 🔧 開発ツール
    #==============================
    for tool in git make python3 pip3; do
        if check_command $tool; then
            log "$tool version: $($tool --version | head -n1)"
        else
            log "$tool: Not installed"
        fi
    done

    #==============================
    # 🐍 Node.js系
    #==============================
    if check_command node; then
        log "Node.js version: $(node -v)"
        log "npm version: $(npm -v)"
        if [ -s "/home/ec2-user/.nvm/nvm.sh" ]; then
            . "/home/ec2-user/.nvm/nvm.sh"
            log "nvm version: $(nvm --version)"
        else
            log "nvm: Not found"
        fi
    else
        log "Node.js: Not installed"
    fi

    #==============================
    # 🐘 言語 / データベース
    #==============================
    if check_command go; then
        log "Go version: $(go version)"
    else
        log "Go: Not installed"
    fi

    if check_command rustc; then
        log "Rust version: $(rustc --version)"
    fi

    if check_command duckdb; then
        log "DuckDB version: $(duckdb --version)"
    fi

    #==============================
    # 🐳 Docker関連
    #==============================
    if check_command docker; then
        log "Docker version: $(docker --version)"
        docker info | head -n 10 | while read -r line; do log "$line"; done || true
    else
        log "Docker: Not installed"
    fi

    if docker compose version &>/dev/null; then
        log "Docker Compose v2 version: $(docker compose version)"
    elif check_command docker-compose; then
        log "Docker Compose v1 version: $(docker-compose --version)"
    fi

    #==============================
    # ☁️ AWS & CLIツール
    #==============================
    if check_command aws; then
        log "AWS CLI version: $(aws --version 2>&1)"
        if aws sts get-caller-identity &>/dev/null; then
            aws sts get-caller-identity | while read -r line; do log "$line"; done
        else
            log "❌ AWS認証エラー"
        fi
        aws configure list | while read -r line; do log "$line"; done
    fi

    if check_command terraform; then
        log "Terraform version: $(terraform --version | head -n1)"
    fi

    if check_command ansible; then
        log "Ansible version: $(ansible --version | head -n1)"
    elif [ -x "/home/ec2-user/.local/bin/ansible" ]; then
        log "Ansible version: $(/home/ec2-user/.local/bin/ansible --version | head -n1)"
    fi

    if check_command gh; then
        log "GitHub CLI version: $(gh version | head -n1)"
    fi

    #==============================
    # ☸️ Kubernetes関連
    #==============================
    if check_command kubectl; then
        log "kubectl version: $(kubectl version --client=true --short)"
    fi

    if check_command helm; then
        log "Helm version: $(helm version --short)"
    fi

    if check_command eksctl; then
        log "eksctl version: $(eksctl version)"
    fi

    if check_command k3s; then
        log "k3s version: $(k3s --version | head -n1)"
    fi

    if check_command kind; then
        log "kind version: $(kind version)"
    fi
}

check_versions
