#!/bin/bash
set -euo pipefail

# 定数定義
readonly LOG_FILE="/home/ubuntu/setup-output.log"
readonly USER_NAME="ubuntu"
readonly DEV_DIR="/home/${USER_NAME}/dev"
readonly ANSIBLE_DIR="/home/${USER_NAME}/dev/private-kit/enviroment/platform/wsl-ubuntu/ansible"

# Discord Webhook URL
readonly DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

# AWS認証情報
readonly AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
readonly AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
readonly AwsRegion="ap-northeast-1"

# Git認証情報
readonly GIT_USER_NAME="${GIT_USER_NAME:-YOUR_NAME}"
readonly GIT_USER_EMAIL="${GIT_USER_EMAIL:-your-email@example.com}"

# ログ出力関数
log() {
    local message="$1"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] ${message}" | tee -a "$LOG_FILE"
}

# Discord通知関数
send_discord_notification() {
    local message="$1"
    if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
        log "ℹ️ Discord Webhook未設定のため通知をスキップします"
        return 0
    fi
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"Setup Bot\",
            \"avatar_url\": \"https://example.com/avatar.png\",
            \"embeds\": [{
                \"title\": \"Setup Notification\",
                \"description\": \"${message}\",
                \"color\": 5814783,
                \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
            }]
        }" "$DISCORD_WEBHOOK_URL" || log "⚠️ Discord通知の送信に失敗しました"
}

# エラーハンドリング関数
handle_error() {
    local error_message="$1"
    log "❌ ${error_message}"
    send_discord_notification "❌ [Error] ${error_message}"
    exit 1
}

# パッケージインストール関数
install_packages() {
    log "🔧 基本パッケージのインストールを開始"
    send_discord_notification "🔧 Installing basic packages"

    sudo apt update >> "$LOG_FILE" 2>&1 || handle_error "パッケージの更新に失敗しました"
    sudo apt upgrade -y >> "$LOG_FILE" 2>&1 || handle_error "パッケージのアップグレードに失敗しました"
    sudo apt install -y git unzip curl python3 python3-pip python3-venv software-properties-common >> "$LOG_FILE" 2>&1 || handle_error "必要なパッケージのインストールに失敗しました"

    log "✅ 基本パッケージのインストールが完了しました"
}

# Ansibleインストール関数
install_ansible() {
    log "🔧 Ansibleのインストールを開始"
    send_discord_notification "📦 Installing Ansible"

    # Ansibleリポジトリの追加
    sudo add-apt-repository --yes --update ppa:ansible/ansible >> "$LOG_FILE" 2>&1 || handle_error "Ansibleリポジトリの追加に失敗しました"
    
    # Ansibleのインストール
    sudo apt install -y ansible >> "$LOG_FILE" 2>&1 || handle_error "Ansibleのインストールに失敗しました"

    # バージョン確認
    ansible --version >> "$LOG_FILE" 2>&1 || handle_error "Ansibleのインストール確認に失敗しました"

    log "✅ Ansibleのインストールが完了しました"
}

# passwordless sudo設定関数
setup_passwordless_sudo() {
    log "🔧 passwordless sudo設定を開始"
    send_discord_notification "🔐 Setting up passwordless sudo"

    # ubuntuユーザーにpasswordless sudo権限を付与
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ubuntu >> "$LOG_FILE" 2>&1 || handle_error "passwordless sudoの設定に失敗しました"
    
    # 権限の設定
    sudo chmod 440 /etc/sudoers.d/ubuntu >> "$LOG_FILE" 2>&1 || handle_error "sudoersファイルの権限設定に失敗しました"

    # 設定の確認
    sudo -u "$USER_NAME" sudo -n true >> "$LOG_FILE" 2>&1 || handle_error "passwordless sudoの動作確認に失敗しました"

    log "✅ passwordless sudo設定が完了しました"
}

# SSH設定関数
setup_ssh() {
    log "🔧 SSH設定を開始"
    local ssh_dir="/home/${USER_NAME}/.ssh"
    
    # ubuntu ユーザーのホームディレクトリにSSHキーを設定
    sudo -u "$USER_NAME" mkdir -p "$ssh_dir"
    sudo -u "$USER_NAME" chmod 700 "$ssh_dir"

    if [[ ! -f "$ssh_dir/id_rsa" ]]; then
        handle_error "SSH秘密鍵が見つかりません。安全な方法で事前に配置してください"
    fi
    sudo -u "$USER_NAME" chmod 600 "$ssh_dir/id_rsa"

    # SSH config設定
    sudo -u "$USER_NAME" tee "$ssh_dir/config" > /dev/null << 'CONFIG'
Host github.com
  IdentityFile ~/.ssh/id_rsa
  StrictHostKeyChecking accept-new
CONFIG
    sudo -u "$USER_NAME" chmod 600 "$ssh_dir/config"

    # GitHub known_hosts
    sudo -u "$USER_NAME" ssh-keyscan github.com >> "$ssh_dir/known_hosts"
    sudo -u "$USER_NAME" chmod 644 "$ssh_dir/known_hosts"

    log "✅ SSH設定が完了しました"
}

# AWS設定関数
setup_aws() {
    log "🔧 AWS設定を開始"
    local aws_dir="/home/${USER_NAME}/.aws"

    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        handle_error "AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY を環境変数で渡してください"
    fi
    
    sudo -u "$USER_NAME" mkdir -p "$aws_dir"
    sudo -u "$USER_NAME" chmod 700 "$aws_dir"

    # AWS認証情報の設定
    sudo -u "$USER_NAME" tee "$aws_dir/credentials" > /dev/null << CRED
[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
CRED
    sudo -u "$USER_NAME" tee "$aws_dir/config" > /dev/null << CONF
[default]
region = ${AwsRegion}
output = json
CONF
    sudo -u "$USER_NAME" chmod 600 "$aws_dir/credentials" "$aws_dir/config"

    # 環境変数の設定
    sudo -u "$USER_NAME" tee -a "/home/${USER_NAME}/.bashrc" > /dev/null << 'ENV'
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
export AwsRegion=${AwsRegion}
ENV

    log "✅ AWS設定が完了しました"
}

# Git設定関数
setup_git() {
    log "🔧 Git設定を開始"
    
    sudo -u "$USER_NAME" git config --global user.name "$GIT_USER_NAME"
    sudo -u "$USER_NAME" git config --global user.email "$GIT_USER_EMAIL"

    # リポジトリクローン
    sudo -u "$USER_NAME" mkdir -p "$DEV_DIR"
    cd "$DEV_DIR" || handle_error "開発ディレクトリの作成に失敗しました"
    sudo -u "$USER_NAME" git clone git@github.com:YOUR_GITHUB_ACCOUNT/private-kit.git >> "$LOG_FILE" 2>&1 || handle_error "リポジトリのクローンに失敗しました"

    log "✅ Git設定が完了しました"
}

# Ansible実行関数
run_ansible() {
    log "🔧 Ansible playbookの実行を開始"
    send_discord_notification "🎭 Running Ansible playbook"

    cd "$ANSIBLE_DIR" || handle_error "Ansibleディレクトリへの移動に失敗しました"

    # playbookの実行（EC2 Ubuntu用設定、passwordless sudoを使用）
    sudo -u "$USER_NAME" ansible-playbook site.yml \
        -i inventory/hosts \
        --connection=local \
        --become \
        --become-method=sudo \
        -v >> "$LOG_FILE" 2>&1 || handle_error "Ansible playbookの実行に失敗しました"

    log "✅ Ansible playbookの実行が完了しました"
}

# メイン処理
main() {
    log "🚀 ユーザーデータセットアップを開始"
    send_discord_notification "🛠️ User data setup started"

    install_packages
    install_ansible
    setup_passwordless_sudo
    setup_ssh
    setup_aws
    setup_git
    run_ansible

    log "✅ ユーザーデータセットアップが完了しました"
    send_discord_notification "🎉 [Success] User data setup completed successfully"
}

# エラーハンドリング
trap 'handle_error "予期せぬエラーが発生しました"' ERR

# メイン処理の実行
main
