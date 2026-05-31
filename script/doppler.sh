#!/bin/bash

# Doppler Login and Environment Variables Reference Sample
# Dopplerにログインして環境変数を参照するサンプルコード

set -euo pipefail

# ログ設定
LOG_FILE="/var/log/doppler.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ログ関数
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# エラーハンドリング
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Doppler CLIのインストール確認
check_doppler_cli() {
    if ! command -v doppler &> /dev/null; then
        log "Installing Doppler CLI..."
        
        # Linux用のインストール
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
        else
            handle_error "Doppler CLI installation not supported for this OS"
        fi
    fi
    
    log "Doppler CLI is available"
}

# Dopplerへのログイン
doppler_login() {
    log "Logging into Doppler..."
    
    # サービストークンを使用したログイン
    if [[ -n "${DOPPLER_TOKEN:-}" ]]; then
        doppler configure set token "$DOPPLER_TOKEN"
        log "Logged in using service token"
    else
        # インタラクティブログイン
        doppler login
        log "Logged in interactively"
    fi
}

# プロジェクトとコンフィグの設定
setup_project_config() {
    local ProjectName="${DOPPLER_PROJECT:-}"
    local config_name="${DOPPLER_CONFIG:-}"
    
    if [[ -n "$ProjectName" ]]; then
        doppler configure set project "$ProjectName"
        log "Project set to: $ProjectName"
    fi
    
    if [[ -n "$config_name" ]]; then
        doppler configure set config "$config_name"
        log "Config set to: $config_name"
    fi
}

# 環境変数の取得と表示
get_Environment_variables() {
    log "Fetching Environment variables..."
    
    # 全環境変数を取得
    echo "=== All Environment Variables ==="
    doppler secrets --format=env
    
    echo ""
    echo "=== Specific Variables ==="
    
    # 特定の環境変数を取得
    local specific_vars=("DATABASE_URL" "API_KEY" "JWT_SECRET" "REDIS_URL")
    
    for var in "${specific_vars[@]}"; do
        local value
        if value=$(doppler secrets get "$var" --format=env 2>/dev/null); then
            echo "$var=$(echo "$value" | cut -d'=' -f2-)"
        else
            echo "$var=NOT_FOUND"
        fi
    done
}

# 環境変数をファイルに保存
save_to_env_file() {
    local env_file="${1:-.env}"
    
    log "Saving Environment variables to $env_file"
    
    doppler secrets --format=env > "$env_file"
    log "Environment variables saved to $env_file"
}

# 環境変数をDocker Compose用に保存
save_for_docker_compose() {
    local env_file="${1:-.env.doppler}"
    
    log "Saving Environment variables for Docker Compose"
    
    # Docker Compose用の形式で保存
    doppler secrets --format=env > "$env_file"
    
    # Docker Composeファイルの例
    cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  app:
    env_file:
      - $env_file
    Environment:
      - NODE_ENV=production
EOF
    
    log "Docker Compose configuration created"
}

# 環境変数の検証
validate_Environment_variables() {
    log "Validating required Environment variables..."
    
    local required_vars=("DATABASE_URL" "API_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! doppler secrets get "$var" --format=env &>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        handle_error "Missing required Environment variables: ${missing_vars[*]}"
    fi
    
    log "All required Environment variables are present"
}

# メイン処理
main() {
    log "Starting Doppler Environment setup"
    
    # Doppler CLIの確認
    check_doppler_cli
    
    # ログイン
    doppler_login
    
    # プロジェクトとコンフィグの設定
    setup_project_config
    
    # 環境変数の検証
    validate_Environment_variables
    
    # 環境変数の取得と表示
    get_Environment_variables
    
    # ファイルへの保存
    save_to_env_file
    
    # Docker Compose用の設定
    save_for_docker_compose
    
    log "Doppler Environment setup completed successfully"
}

# ヘルプ表示
show_help() {
    cat << EOF
Doppler Environment Setup Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -f, --file FILE         Save Environment variables to specific file
    -d, --docker            Create Docker Compose configuration
    -v, --validate          Validate required Environment variables only

Environment Variables:
    DOPPLER_TOKEN          Doppler service token for authentication
    DOPPLER_PROJECT        Doppler project name
    DOPPLER_CONFIG         Doppler configuration name

Examples:
    $0                      # Full setup with interactive login
    $0 -f .env.prod        # Save to specific file
    $0 -d                  # Create Docker Compose config
    $0 -v                  # Validate only

EOF
}

# コマンドライン引数の処理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -f|--file)
        if [[ -n "${2:-}" ]]; then
            save_to_env_file "$2"
        else
            handle_error "File path required for -f option"
        fi
        ;;
    -d|--docker)
        save_for_docker_compose
        ;;
    -v|--validate)
        check_doppler_cli
        doppler_login
        setup_project_config
        validate_Environment_variables
        log "Validation completed successfully"
        ;;
    "")
        main
        ;;
    *)
        handle_error "Unknown option: $1"
        ;;
esac
