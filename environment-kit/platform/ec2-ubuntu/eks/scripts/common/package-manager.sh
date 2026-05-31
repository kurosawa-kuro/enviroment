#!/bin/bash

# =============================================================================
# Package Manager Functions
# =============================================================================
# このスクリプトはパッケージ管理の共通機能を提供します

# Source common color functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"

# =============================================================================
# System Update Functions
# =============================================================================

# Update system packages
update_system_packages() {
    print_info "システムパッケージを更新中..."
    sudo apt update && sudo apt upgrade -y
    print_success "システムパッケージの更新が完了しました"
}

# Install basic packages
install_basic_packages() {
    local packages=("$@")
    
    if [ ${#packages[@]} -eq 0 ]; then
        packages=("curl" "wget" "apt-transport-https" "ca-certificates" "gnupg" "lsb-release")
    fi
    
    print_info "基本パッケージをインストール中..."
    print_info "インストール対象: ${packages[*]}"
    
    sudo apt install -y "${packages[@]}"
    print_success "基本パッケージのインストールが完了しました"
}

# =============================================================================
# Repository Management Functions
# =============================================================================

# Add GPG key
add_gpg_key() {
    local key_url=$1
    local key_file=$2
    
    print_info "GPGキーを追加中: $key_url"
    
    if [ -n "$key_file" ]; then
        curl -fsSL "$key_url" | sudo gpg --dearmor -o "$key_file"
    else
        curl -fsSL "$key_url" | sudo apt-key add -
    fi
    
    print_success "GPGキーの追加が完了しました"
}

# Add repository
add_repository() {
    local repo_line=$1
    local repo_file=$2
    
    print_info "リポジトリを追加中: $repo_line"
    
    if [ -n "$repo_file" ]; then
        echo "$repo_line" | sudo tee "$repo_file"
    else
        echo "$repo_line" | sudo tee /etc/apt/sources.list.d/additional.list
    fi
    
    print_success "リポジトリの追加が完了しました"
}

# =============================================================================
# Binary Installation Functions
# =============================================================================

# Download and install binary
install_binary() {
    local download_url=$1
    local binary_name=$2
    local install_path=${3:-"/usr/local/bin"}
    
    print_info "バイナリをインストール中: $binary_name"
    print_info "ダウンロードURL: $download_url"
    print_info "インストール先: $install_path"
    
    # Download binary
    curl -sSL -o "$binary_name" "$download_url"
    
    # Make executable
    chmod +x "$binary_name"
    
    # Install to system path
    sudo install -m 555 "$binary_name" "$install_path/$binary_name"
    
    # Clean up
    rm "$binary_name"
    
    print_success "$binary_name のインストールが完了しました"
}

# =============================================================================
# Validation Functions
# =============================================================================

# Check if command exists
check_command() {
    local command_name=$1
    local install_instructions=$2
    
    if ! command -v "$command_name" &> /dev/null; then
        print_error "$command_name がインストールされていません。"
        if [ -n "$install_instructions" ]; then
            print_info "$install_instructions"
        fi
        return 1
    fi
    
    print_success "$command_name が利用可能です"
    return 0
}

# Check if package is installed
check_package() {
    local package_name=$1
    
    if dpkg -l | grep -q "^ii.*$package_name"; then
        print_success "$package_name がインストールされています"
        return 0
    else
        print_warning "$package_name がインストールされていません"
        return 1
    fi
}

# =============================================================================
# Version Check Functions
# =============================================================================

# Get command version
get_command_version() {
    local command_name=$1
    local version_flag=${2:-"--version"}
    
    if command -v "$command_name" &> /dev/null; then
        local version=$("$command_name" "$version_flag" 2>/dev/null | head -n 1)
        echo "$version"
    else
        echo "not installed"
    fi
}

# Print installation summary
print_installation_summary() {
    local title=$1
    shift
    local commands=("$@")
    
    print_section "$title"
    
    for cmd in "${commands[@]}"; do
        IFS=':' read -r name flag <<< "$cmd"
        local version=$(get_command_version "$name" "$flag")
        print_info "$name: $version"
    done
    
    print_separator
}

# =============================================================================
# Export Functions
# =============================================================================

# Export all functions
export -f update_system_packages install_basic_packages
export -f add_gpg_key add_repository
export -f install_binary
export -f check_command check_package
export -f get_command_version print_installation_summary
