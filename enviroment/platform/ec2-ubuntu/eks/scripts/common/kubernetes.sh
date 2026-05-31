#!/bin/bash

# =============================================================================
# Kubernetes Management Functions
# =============================================================================
# このスクリプトはKubernetes管理の共通機能を提供します

# Source common color functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"

# =============================================================================
# Namespace Management
# =============================================================================

# Create namespace if not exists
create_namespace() {
    local namespace=$1
    
    print_info "ネームスペースを作成中: $namespace"
    
    if kubectl get namespace "$namespace" &> /dev/null; then
        print_warning "ネームスペース $namespace は既に存在します"
    else
        kubectl create namespace "$namespace"
        print_success "ネームスペース $namespace を作成しました"
    fi
}

# =============================================================================
# Resource Management
# =============================================================================

# Apply manifest from URL
apply_manifest_from_url() {
    local url=$1
    local namespace=${2:-""}
    
    print_info "マニフェストを適用中: $url"
    
    if [ -n "$namespace" ]; then
        kubectl apply -n "$namespace" -f "$url"
    else
        kubectl apply -f "$url"
    fi
    
    print_success "マニフェストの適用が完了しました"
}

# Wait for deployment to be ready
wait_for_deployment() {
    local deployment_name=$1
    local namespace=$2
    local timeout=${3:-300}
    
    print_info "デプロイメントの準備完了を待機中: $deployment_name"
    print_info "タイムアウト: ${timeout}秒"
    
    kubectl wait --for=condition=available --timeout="${timeout}s" \
        deployment/"$deployment_name" -n "$namespace"
    
    print_success "デプロイメント $deployment_name が準備完了しました"
}

# =============================================================================
# Secret Management
# =============================================================================

# Get secret value
get_secret_value() {
    local secret_name=$1
    local namespace=$2
    local key=$3
    
    print_info "シークレット値を取得中: $secret_name.$key"
    
    local value=$(kubectl -n "$namespace" get secret "$secret_name" \
        -o jsonpath="{.data.$key}" | base64 -d)
    
    if [ -n "$value" ]; then
        print_success "シークレット値の取得が完了しました"
        echo "$value"
    else
        print_error "シークレット値の取得に失敗しました"
        return 1
    fi
}

# =============================================================================
# Service Management
# =============================================================================

# Patch service type
patch_service_type() {
    local service_name=$1
    local namespace=$2
    local service_type=$3
    
    print_info "サービスタイプを変更中: $service_name -> $service_type"
    
    kubectl patch svc "$service_name" -n "$namespace" \
        -p "{\"spec\":{\"type\":\"$service_type\"}}"
    
    print_success "サービスタイプの変更が完了しました"
}

# Get service port
get_service_port() {
    local service_name=$1
    local namespace=$2
    local port_type=${3:-"nodePort"}
    
    print_info "サービスポートを取得中: $service_name ($port_type)"
    
    local port=$(kubectl get svc "$service_name" -n "$namespace" \
        -o jsonpath="{.spec.ports[0].$port_type}")
    
    if [ -n "$port" ]; then
        print_success "サービスポートの取得が完了しました: $port"
        echo "$port"
    else
        print_error "サービスポートの取得に失敗しました"
        return 1
    fi
}

# =============================================================================
# Cluster Information
# =============================================================================

# Get cluster info
get_cluster_info() {
    print_info "クラスター情報を取得中..."
    
    print_subsection "クラスター情報"
    kubectl cluster-info
    
    print_subsection "ノード情報"
    kubectl get nodes -o wide
    
    print_subsection "ネームスペース"
    kubectl get namespaces
}

# Check cluster connectivity
check_cluster_connectivity() {
    print_info "クラスター接続を確認中..."
    
    if kubectl cluster-info &> /dev/null; then
        print_success "クラスターに正常に接続されています"
        return 0
    else
        print_error "クラスターに接続できません"
        return 1
    fi
}

# =============================================================================
# Resource Monitoring
# =============================================================================

# Get resource usage
get_resource_usage() {
    local namespace=${1:-"all"}
    
    print_info "リソース使用量を取得中..."
    
    if [ "$namespace" = "all" ]; then
        print_subsection "全ネームスペースのリソース使用量"
        kubectl top nodes
        kubectl top pods --all-namespaces
    else
        print_subsection "ネームスペース $namespace のリソース使用量"
        kubectl top pods -n "$namespace"
    fi
}

# =============================================================================
# Utility Functions
# =============================================================================

# Check if kubectl is available
check_kubectl() {
    check_command "kubectl" "kubectlをインストールしてください"
}

# Get kubectl version
get_kubectl_version() {
    get_command_version "kubectl" "version --client --short"
}

# =============================================================================
# Export Functions
# =============================================================================

# Export all functions
export -f create_namespace
export -f apply_manifest_from_url wait_for_deployment
export -f get_secret_value
export -f patch_service_type get_service_port
export -f get_cluster_info check_cluster_connectivity
export -f get_resource_usage
export -f check_kubectl get_kubectl_version
