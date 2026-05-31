#!/bin/bash

# Version Check Script for WSL Ubuntu
# Author: AI Assistant
# Version: 2.0

set -euo pipefail
trap 'log_error "エラーが発生しました: $?"' ERR

# Source common logging utilities
source "$(dirname "$0")/common/logging.sh"

log_header() {
    log_step "=================================================="
    log_step "$1"
    log_step "=================================================="
}

check_command() {
    command -v "$1" &>/dev/null
}

activate_venv() {
    # 仮想環境が存在する場合は自動的に有効化
    VENV_PATH="/home/ubuntu/myenv"
    if [ -d "$VENV_PATH" ]; then
        log_success "仮想環境をアクティブ化します..."
        source "$VENV_PATH/bin/activate" || {
            log_error "仮想環境のアクティブ化に失敗しました"
            exit 1
        }
    else
        log_warning "仮想環境が見つかりません。"
    fi
}

check_versions() {
    log_header "インストール済みのコンポーネントバージョンを確認します..."

    # 仮想環境を有効化
    activate_venv

    # ユーザーのホームディレクトリを設定
    USER_HOME="$HOME"  # 現在のユーザーのホームディレクトリを使用

    #==============================
    # 🔧 開発ツール
    #==============================
    log_header "🔧 開発ツール"
    for tool in git make curl wget tree python3 pip3; do
        if check_command $tool; then
            log_success "$tool version: $($tool --version | head -n1)"
        else
            log_warning "$tool: Not installed"
        fi
    done

    #==============================
    # 🐍 Node.js系
    #==============================
    log_header "🐍 Node.js系"
    if check_command node; then
        log_success "Node.js version: $(node -v)"
        log_success "npm version: $(npm -v)"
    else
        log_warning "Node.js: Not installed"
    fi

    #==============================
    # 🐘 言語 / データベース
    #==============================
    log_header "🐘 言語 / データベース"
    if check_command go; then
        log_success "Go version: $(go version)"
    else
        log_warning "Go: Not installed"
    fi

    #==============================
    # 🐘 PostgreSQL
    #==============================
    log_header "🐘 PostgreSQL"
    if check_command psql; then
        log_success "PostgreSQL client version: $(psql --version)"
        
        # PostgreSQLサービス状態確認
        if sudo systemctl is-active --quiet postgresql; then
            log_success "PostgreSQL service: Running"
            
            # PostgreSQL接続確認
            if sudo -u postgres psql -c "SELECT version();" &>/dev/null; then
                log_success "PostgreSQL connection: OK"
                sudo -u postgres psql -c "SELECT version();" | head -n 1 | while read -r line; do log_info "$line"; done
            else
                log_error "PostgreSQL connection: Failed"
            fi
            
            # データベース一覧表示
            log_header "PostgreSQL Databases"
            sudo -u postgres psql -c "\l" | while read -r line; do log_info "$line"; done || log_warning "データベース一覧の取得に失敗しました"
            
        else
            log_warning "PostgreSQL service: Not running"
            
            # サービス起動試行
            log_info "PostgreSQLサービスを起動します..."
            if sudo systemctl start postgresql; then
                log_success "PostgreSQL service started successfully"
            else
                log_error "PostgreSQL service start failed"
            fi
        fi
        
        # PostgreSQL設定ファイルの場所確認
        PG_CONFIG_DIR=$(sudo -u postgres psql -c "SHOW config_file;" 2>/dev/null | grep -E '\.conf$' | head -n1 | tr -d ' ')
        if [ -n "$PG_CONFIG_DIR" ]; then
            log_success "PostgreSQL config: $PG_CONFIG_DIR"
        else
            log_warning "PostgreSQL config file not found"
        fi
        
    else
        log_warning "PostgreSQL: Not installed"
        log_info "PostgreSQLをインストールするには: sudo apt update && sudo apt install postgresql postgresql-contrib"
    fi

    #==============================
    # 🐳 Docker関連
    #==============================
    log_header "🐳 Docker関連"
    if check_command docker; then
        log_success "Docker version: $(docker --version)"
        sudo docker info | head -n 10 | while read -r line; do log_info "$line"; done || true
    else
        log_warning "Docker: Not installed"
    fi

    #==============================
    # ☁️ AWS & CLIツール
    #==============================
    log_header "☁️ AWS & CLIツール"
    if check_command aws; then
        log_success "AWS CLI version: $(aws --version 2>&1)"
        
        # AWS認証情報を環境変数として設定
        if [ -f "$USER_HOME/.aws/credentials" ]; then
            # 認証情報ファイルから読み込み
            AWS_ACCESS_KEY_ID=$(grep aws_access_key_id "$USER_HOME/.aws/credentials" | cut -d= -f2 | tr -d ' ')
            AWS_SECRET_ACCESS_KEY=$(grep aws_secret_access_key "$USER_HOME/.aws/credentials" | cut -d= -f2 | tr -d ' ')
            AwsRegion=$(grep region "$USER_HOME/.aws/config" 2>/dev/null | cut -d= -f2 | tr -d ' ' || echo "ap-northeast-1")
            
            # 環境変数を設定
            export AWS_ACCESS_KEY_ID
            export AWS_SECRET_ACCESS_KEY
            export AwsRegion
            
            log_success "AWS認証情報を環境変数として設定しました"
            
            # AWS認証確認
            if AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AwsRegion="$AwsRegion" aws sts get-caller-identity &>/dev/null; then
                log_success "AWS認証成功"
                AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AwsRegion="$AwsRegion" aws sts get-caller-identity | while read -r line; do log_info "$line"; done
            else
                log_error "AWS認証エラー"
            fi
            
            # AWS設定情報の表示
            log_header "AWS設定情報"
            AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AwsRegion="$AwsRegion" aws configure list | while read -r line; do log_info "$line"; done
        else
            log_warning "AWS認証情報ファイルが見つかりません: $USER_HOME/.aws/credentials"
        fi
    fi

    #==============================
    # 🏗️ AWS CDK
    #==============================
    log_header "🏗️ AWS CDK"
    if check_command cdk; then
        log_success "AWS CDK version: $(cdk --version)"
        
        # CDKの初期化状態確認
        if [ -f "cdk.json" ]; then
            log_success "CDK project: Initialized (cdk.json found)"
            
            # CDKアプリケーションの状態確認
            if cdk list &>/dev/null; then
                log_success "CDK stacks: Available"
                log_header "CDK Stacks"
                cdk list | while read -r line; do log_info "$line"; done
            else
                log_warning "CDK stacks: Not available or error occurred"
            fi
            
            # CDKの依存関係確認
            if [ -f "package.json" ]; then
                log_success "CDK dependencies: package.json found"
                if check_command npm; then
                    log_header "CDK Dependencies"
                    npm list --depth=0 | grep -E "(aws-cdk|@aws-cdk)" | while read -r line; do log_info "$line"; done || log_warning "CDK dependencies not found in package.json"
                fi
            else
                log_warning "CDK dependencies: package.json not found"
            fi
        else
            log_warning "CDK project: Not initialized (cdk.json not found)"
            log_info "CDKプロジェクトを初期化するには: cdk init app --language typescript"
        fi
        
        # CDKのグローバル設定確認
        if [ -d "$HOME/.cdk" ]; then
            log_success "CDK global config: Found ($HOME/.cdk)"
        else
            log_warning "CDK global config: Not found"
        fi
        
    else
        log_warning "AWS CDK: Not installed"
        log_info "AWS CDKをインストールするには: npm install -g aws-cdk"
    fi

    #==============================
    # 🛠️ インフラツール
    #==============================
    log_header "🛠️ インフラツール"
    if check_command terraform; then
        log_success "Terraform version: $(terraform --version | head -n1)"
    else
        log_warning "Terraform: Not installed"
    fi

    if check_command ansible; then
        log_success "Ansible version: $(ansible --version | head -n1)"
    elif [ -x "$USER_HOME/.local/bin/ansible" ]; then
        log_success "Ansible version: $($USER_HOME/.local/bin/ansible --version | head -n1)"
    else
        log_warning "Ansible: Not installed"
    fi

    if check_command gh; then
        log_success "GitHub CLI version: $(gh version | head -n1)"
    else
        log_warning "GitHub CLI: Not installed"
    fi

    #==============================
    # ☸️ Kubernetes関連
    #==============================
    log_header "☸️ Kubernetes関連"
    if check_command kubectl; then
        log_success "kubectl version: $(kubectl version --client=true --short)"
    else
        log_warning "kubectl: Not installed"
    fi

    if check_command helm; then
        log_success "Helm version: $(helm version --short)"
    else
        log_warning "Helm: Not installed"
    fi

    if check_command eksctl; then
        log_success "eksctl version: $(eksctl version)"
    else
        log_warning "eksctl: Not installed"
    fi

    if check_command k3s; then
        log_success "k3s version: $(k3s --version | head -n1)"
    else
        log_warning "k3s: Not installed"
    fi

    if check_command kind; then
        log_success "kind version: $(kind version)"
    else
        log_warning "kind: Not installed"
    fi

    # ==============================
    # 🐍 Python基本ツール
    # ==============================
    log_header "🐍 Python基本ツール"
    if check_command python3; then
        log_success "Python version: $(python3 --version)"
    else
        log_warning "Python3: Not installed"
    fi

    if check_command pip3; then
        log_success "pip3 version: $(pip3 --version)"
    else
        log_warning "pip3: Not installed"
    fi
    
    log_header "✅ バージョン確認完了"
}

# Script entry point
main() {
    setup_logging
    check_versions
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
