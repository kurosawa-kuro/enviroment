#!/bin/bash

# Ubuntu環境での開発環境セットアップスクリプト
# 対応ツール: Node.js, Go, Python3, pipx, Doppler CLI

set -euo pipefail  # エラー時に即座に終了、未定義変数の使用を禁止

# 設定
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="${SCRIPT_DIR}/install.log"
readonly GO_VERSION="1.21.5"
readonly NODE_LTS_VERSION="lts"

# 開発ツールリスト
readonly DEV_TOOLS=(
    "jq:JSONプロセッサ"
    "tree:ディレクトリ構造表示"
)

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "\033[36m[STEP]\033[0m $1" | tee -a "$LOG_FILE"
}

# エラーハンドリング関数
handle_error() {
    local exit_code=$?
    log_error "スクリプトがエラーで終了しました (終了コード: $exit_code)"
    log_error "ログファイルを確認してください: $LOG_FILE"
    exit $exit_code
}

# トラップ設定
trap handle_error ERR

# システム情報表示
show_system_info() {
    log_info "=== Ubuntu環境での開発環境セットアップ ==="
    log_info "OS: $(lsb_release -d | cut -f2)"
    log_info "カーネル: $(uname -r)"
    log_info "アーキテクチャ: $(uname -m)"
    log_info "スクリプト実行日時: $(date)"
}

# システムパッケージ更新
update_system_packages() {
    log_step "システムパッケージを更新中..."
    
    # パッケージリストの更新のみ実行（アップグレードはスキップ）
    sudo apt update
    log_info "システムパッケージリストの更新が完了しました"
    log_info "注意: システムアップグレードは手動で実行してください"
}

# Node.jsインストール
install_nodejs() {
    log_step "Node.jsをインストール中..."
    
    # 既にインストール済みかチェック
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        log_info "Node.jsは既にインストール済みです: $node_version"
        log_info "npmは既にインストール済みです: $npm_version"
        return 0
    fi
    
    # NodeSourceリポジトリの追加
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_LTS_VERSION}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # バージョン確認
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    log_info "Node.js: $node_version"
    log_info "npm: $npm_version"
}

# Goインストール
install_go() {
    log_step "Goをインストール中..."
    
    # 既にインストール済みかチェック
    if command -v go >/dev/null 2>&1; then
        local go_version=$(go version)
        log_info "Goは既にインストール済みです: $go_version"
        return 0
    fi
    
    # 既存のGoを削除
    sudo rm -rf /usr/local/go
    
    # Goのダウンロードとインストール
    local go_archive="go${GO_VERSION}.linux-amd64.tar.gz"
    wget "https://go.dev/dl/${go_archive}"
    sudo tar -C /usr/local -xzf "$go_archive"
    rm "$go_archive"
    
    # パス設定
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    fi
    export PATH=$PATH:/usr/local/go/bin
    
    # バージョン確認
    local go_version=$(go version)
    log_info "Go: $go_version"
}

# Python3インストール
install_python3() {
    log_step "Python3をインストール中..."
    
    # 既にインストール済みかチェック
    if command -v python3 >/dev/null 2>&1 && command -v pip3 >/dev/null 2>&1; then
        local python_version=$(python3 --version)
        local pip_version=$(pip3 --version | cut -d' ' -f2)
        log_info "Python3は既にインストール済みです: $python_version"
        log_info "pip3は既にインストール済みです: $pip_version"
        return 0
    fi
    
    sudo apt-get install -y python3 python3-pip python3-venv
    
    # バージョン確認
    local python_version=$(python3 --version)
    local pip_version=$(pip3 --version | cut -d' ' -f2)
    log_info "Python3: $python_version"
    log_info "pip3: $pip_version"
}

# pipxインストール
install_pipx() {
    log_step "pipxをインストール中..."
    
    # 既にインストール済みかチェック
    if command -v pipx >/dev/null 2>&1; then
        local pipx_version=$(pipx --version)
        log_info "pipxは既にインストール済みです: $pipx_version"
        return 0
    fi
    
    # Ubuntu 22.04以降ではaptパッケージマネージャーを使用
    if command -v apt >/dev/null 2>&1; then
        log_info "aptパッケージマネージャーを使用してpipxをインストール中..."
        sudo apt-get install -y pipx
    else
        log_info "pipを使用してpipxをインストール中..."
        python3 -m pip install --user --break-system-packages pipx
    fi
    
    # pipxのパス設定
    python3 -m pipx ensurepath
    
    # パス設定
    if ! grep -q "\$HOME/.local/bin" ~/.bashrc; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    fi
    export PATH="$HOME/.local/bin:$PATH"
    
    # バージョン確認
    local pipx_version=$(pipx --version)
    log_info "pipx: $pipx_version"
}

# Doppler CLIインストール
install_doppler() {
    log_step "Doppler CLIをインストール中..."
    
    # 既にインストール済みかチェック
    if command -v doppler >/dev/null 2>&1; then
        local doppler_version=$(doppler --version)
        log_info "Doppler CLIは既にインストール済みです: $doppler_version"
        return 0
    fi
    
    # sudo権限でDoppler CLIをインストール
    curl -sLf --retry 3 --retry-delay 1 https://cli.doppler.com/install.sh | sudo sh
    
    # バージョン確認
    local doppler_version=$(doppler --version)
    log_info "Doppler CLI: $doppler_version"
}

# 開発ツールインストール
install_dev_tools() {
    log_step "開発ツールをインストール中..."
    
    for tool_info in "${DEV_TOOLS[@]}"; do
        local cmd="${tool_info%%:*}"
        local description="${tool_info##*:}"
        
        # 既にインストール済みかチェック
        if command -v "$cmd" >/dev/null 2>&1; then
            local version=$($cmd --version 2>/dev/null || echo "バージョン不明")
            log_info "$description ($cmd)は既にインストール済みです: $version"
            continue
        fi
        
        log_info "$description ($cmd)をインストール中..."
        sudo apt-get install -y "$cmd"
        
        # バージョン確認
        if command -v "$cmd" >/dev/null 2>&1; then
            local version=$($cmd --version 2>/dev/null || echo "バージョン不明")
            log_info "$description ($cmd): $version"
        else
            log_warn "$description ($cmd)のインストールに失敗しました"
        fi
    done
}

# プロジェクト依存関係インストール
install_project_dependencies() {
    log_step "プロジェクトの依存関係をインストール中..."
    
    if [ -f "package.json" ]; then
        log_info "npm依存関係をインストール中..."
        npm install
    fi
    
    if [ -f "go.mod" ]; then
        log_info "Go依存関係をインストール中..."
        go mod download
    fi
    
    if [ -f "requirements.txt" ]; then
        log_info "Python依存関係をインストール中..."
        log_warn "注意: システム全体にPythonパッケージをインストールします"
        pip3 install --break-system-packages -r requirements.txt
    fi
}

# インストール確認
verify_installations() {
    log_step "インストール確認中..."
    
    local tools=(
        "node:Node.js"
        "npm:npm"
        "go:Go"
        "python3:Python3"
        "pip3:pip3"
        "pipx:pipx"
        "doppler:Doppler CLI"
        "jq:jq"
        "tree:tree"
    )
    
    for tool_info in "${tools[@]}"; do
        local cmd="${tool_info%%:*}"
        local name="${tool_info##*:}"
        
        if command -v "$cmd" >/dev/null 2>&1; then
            local version=$($cmd --version 2>/dev/null || $cmd version 2>/dev/null || echo "バージョン不明")
            log_info "$name: $version"
        else
            log_warn "$name: インストールされていません"
        fi
    done
}

# 最終バージョン一覧表示
show_final_version_summary() {
    log_step "=== 最終インストール状況 ==="
    
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                   開発環境セットアップ完了                    │"
    echo "├─────────────────────────────────────────────────────────────┤"
    
    # システム情報
    echo "│ システム情報:"
    echo "│   OS: $(lsb_release -d | cut -f2)"
    echo "│   カーネル: $(uname -r)"
    echo "│   アーキテクチャ: $(uname -m)"
    echo "│"
    
    # 各ツールのバージョン
    local tools=(
        "node:Node.js"
        "npm:npm"
        "go:Go"
        "python3:Python3"
        "pip3:pip3"
        "pipx:pipx"
        "doppler:Doppler CLI"
        "jq:jq"
        "tree:tree"
    )
    
    local all_installed=true
    
    for tool_info in "${tools[@]}"; do
        local cmd="${tool_info%%:*}"
        local name="${tool_info##*:}"
        
        if command -v "$cmd" >/dev/null 2>&1; then
            local version=$($cmd --version 2>/dev/null || $cmd version 2>/dev/null || echo "バージョン不明")
            printf "│   %-15s: %s\n" "$name" "$version"
        else
            printf "│   %-15s: \033[31mインストールされていません\033[0m\n" "$name"
            all_installed=false
        fi
    done
    
    echo "│"
    
    # 環境変数設定状況
    echo "│ 環境変数設定:"
    local path_vars=(
        "/usr/local/go/bin:Go"
        "\$HOME/.local/bin:pipx"
    )
    
    for path_info in "${path_vars[@]}"; do
        local path="${path_info%%:*}"
        local name="${path_info##*:}"
        
        if echo "$PATH" | grep -q "$path"; then
            printf "│   %-15s: \033[32m設定済み\033[0m\n" "$name"
        else
            printf "│   %-15s: \033[33m未設定\033[0m\n" "$name"
        fi
    done
    
    echo "│"
    
    # 最終メッセージ
    if [ "$all_installed" = true ]; then
        echo "│ \033[32m✓ すべてのツールが正常にインストールされました\033[0m"
    else
        echo "│ \033[33m⚠ 一部のツールがインストールされていません\033[0m"
    fi
    
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    
    # 次のステップ
    log_info "次のステップ:"
    log_info "1. 新しいターミナルセッションを開始して環境変数を有効にしてください"
    log_info "2. ログファイル: $LOG_FILE"
    log_info "3. 各ツールの動作確認を行ってください"
}

# 環境変数設定確認
check_environment_setup() {
    log_step "環境変数設定を確認中..."
    
    local path_vars=(
        "/usr/local/go/bin:Go"
        "\$HOME/.local/bin:pipx"
    )
    
    for path_info in "${path_vars[@]}"; do
        local path="${path_info%%:*}"
        local name="${path_info##*:}"
        
        if echo "$PATH" | grep -q "$path"; then
            log_info "$name のパスが設定されています"
        else
            log_warn "$name のパスが設定されていません。新しいターミナルセッションを開始してください"
        fi
    done
}

# メイン実行関数
main() {
    # ログファイル初期化
    echo "=== インストールログ $(date) ===" > "$LOG_FILE"
    
    show_system_info
    update_system_packages
    install_nodejs
    install_go
    install_python3
    install_pipx
    install_doppler
    install_dev_tools
    install_project_dependencies
    verify_installations
    check_environment_setup
    show_final_version_summary
    
    log_info "=== インストール完了 ==="
    log_info "ログファイル: $LOG_FILE"
    log_info "新しいターミナルセッションを開始して環境変数を有効にしてください"
}

# スクリプト実行
main "$@"
