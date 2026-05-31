#!/bin/bash

# EC2 Ubuntu - kubectl and ArgoCD Installation Script
# このスクリプトはEC2 UbuntuインスタンスにkubectlとArgoCDをインストールします

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common/colors.sh"
source "${SCRIPT_DIR}/common/package-manager.sh"
source "${SCRIPT_DIR}/common/kubernetes.sh"

# =============================================================================
# Installation Functions
# =============================================================================

# Install kubectl
install_kubectl() {
    print_section "kubectl Installation"
    
    # Add Google Cloud GPG key
    add_gpg_key "https://packages.cloud.google.com/apt/doc/apt-key.gpg" "/etc/apt/keyrings/kubernetes-archive-keyring.gpg"
    
    # Add Kubernetes repository
    add_repository "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" "/etc/apt/sources.list.d/kubernetes.list"
    
    # Update package list and install kubectl
    sudo apt update
    sudo apt install -y kubectl
    
    # Verify installation
    kubectl version --client
    print_success "kubectlのインストールが完了しました"
}

# Install ArgoCD CLI
install_argocd_cli() {
    print_section "ArgoCD CLI Installation"
    
    # Download and install ArgoCD CLI
    install_binary \
        "https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64" \
        "argocd-linux-amd64" \
        "/usr/local/bin"
    
    # Verify installation
    argocd version --client
    print_success "ArgoCD CLIのインストールが完了しました"
}

# Install ArgoCD server
install_argocd_server() {
    print_section "ArgoCD Server Installation"
    
    # Create namespace
    create_namespace "argocd"
    
    # Apply ArgoCD manifest
    apply_manifest_from_url "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml" "argocd"
    
    # Wait for deployment
    wait_for_deployment "argocd-server" "argocd" 300
    
    print_success "ArgoCDサーバーのインストールが完了しました"
}

# Get ArgoCD password
get_argocd_password() {
    print_section "ArgoCD Password"
    
    local password=$(get_secret_value "argocd-initial-admin-secret" "argocd" "password")
    if [ $? -eq 0 ]; then
        echo "ArgoCD Admin Password: $password"
        print_warning "このパスワードを安全に保存してください"
    else
        print_error "パスワードの取得に失敗しました"
        return 1
    fi
}

# Configure ArgoCD service
configure_argocd_service() {
    print_section "ArgoCD Service Configuration"
    
    # Change service type to NodePort
    patch_service_type "argocd-server" "argocd" "NodePort"
    
    # Get NodePort
    local nodeport=$(get_service_port "argocd-server" "argocd" "nodePort")
    if [ $? -eq 0 ]; then
        print_info "ArgoCD UIは http://<node-ip>:$nodeport でアクセス可能です"
    fi
}



# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_section "EC2 Ubuntu - kubectl and ArgoCD Setup"
    
    # Update system packages
    update_system_packages
    
    # Install basic packages
    install_basic_packages
    
    # Install kubectl
    install_kubectl
    
    # Install ArgoCD CLI
    install_argocd_cli
    
    # Check if Kubernetes cluster is ready
    echo ""
    print_warning "Kubernetesクラスターが準備されているか確認してください"
    read -p "Kubernetesクラスターが準備済みですか？ (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check kubectl connectivity
        if ! check_cluster_connectivity; then
            print_error "Kubernetesクラスターに接続できません"
            exit 1
        fi
        
        # Install ArgoCD server
        install_argocd_server
        
        # Get initial password
        get_argocd_password
        
        # Configure service
        configure_argocd_service
        
        # Print installation summary
        print_installation_summary "Setup Complete" \
            "kubectl:version --client --short" \
            "argocd:version --client --short"
        
        print_info "ArgoCD UI: http://<node-ip>:<nodeport>"
        print_info "デフォルトユーザー: admin"
        print_warning "セキュリティのため、初期パスワードの変更を推奨します"
    else
        print_info "Kubernetesクラスターの準備後に再度スクリプトを実行してください"
    fi
}

# スクリプト実行
main "$@"
