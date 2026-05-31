#!/bin/bash

# =============================================================================
# Configuration Management Functions
# =============================================================================
# このスクリプトは設定管理の共通機能を提供します

# Source common color functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"

# =============================================================================
# Environment Configuration
# =============================================================================

# Environment configurations
readonly ENV_CONFIGS=(
    "com:i-0c8fd89c7abd78506:ap-northeast-1"
    "dev:i-0dd69094f78699749:ap-northeast-1"
    "stg:i-0ee79095f88700850:ap-northeast-1"
)

# Session configurations for com Environment
readonly COM_SESSION_CONFIGS=(
    "argocd:hmile-com-eks-apne1-mntr-argocd.com.hmile-sys.private:80:8080"
    "app:hmile-sbx-eks-apne1-app.sbx.hmile-sys.private:80:8083"
    "grafana:hmile-com-eks-apne1-mntr-grafana.com.hmile-sys.private:80:8090"
    "keycloak_sbx:hmile-sbx-eks-apne1-keycloak.sbx.hmile-sys.private:80:80"
    "kube_alertmanager:hmile-com-eks-apne1-mntr-altmgr.com.hmile-sys.private:9093:9093"
    "prometheus_sbx_hmile:localhost:9091:9091"
    "pgadmin_sbx_hmile:hmile-sbx-eks-apne1-pgadmin.sbx.hmile-sys.private:80:5051"
)

# =============================================================================
# AWS EC2 Instance Discovery Functions
# =============================================================================

# Find EC2 instance by tags
find_instance_by_tags() {
    local env_name=$1
    local aws_profile=${2:-"default"}
    local region=${3:-"ap-northeast-1"}
    
    # Define tag filters based on Environment
    local tag_filters=""
    case $env_name in
        "dev")
            tag_filters="Name=tag:Name,Values=*dev*bastion* Name=instance-state-name,Values=running"
            ;;
        "stg")
            tag_filters="Name=tag:Name,Values=*stg*bastion* Name=instance-state-name,Values=running"
            ;;
        "com")
            tag_filters="Name=tag:Name,Values=*com*bastion* Name=instance-state-name,Values=running"
            ;;
        *)
            tag_filters="Name=tag:Name,Values=*${env_name}* Name=instance-state-name,Values=running"
            ;;
    esac
    
    print_info "タグベースでインスタンスを検索中: $env_name"
    
    # Use AWS CLI to find instances by tags
    local instance_info
    if [ "$aws_profile" = "default" ]; then
        instance_info=$(aws ec2 describe-instances \
            --region "$region" \
            --filters $tag_filters \
            --query 'Reservations[*].Instances[*].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0],PrivateIpAddress,PublicIpAddress]' \
            --output table 2>/dev/null)
    else
        instance_info=$(aws ec2 describe-instances \
            --profile "$aws_profile" \
            --region "$region" \
            --filters $tag_filters \
            --query 'Reservations[*].Instances[*].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0],PrivateIpAddress,PublicIpAddress]' \
            --output table 2>/dev/null)
    fi
    
    if [ $? -ne 0 ]; then
        print_error "AWS CLIコマンドの実行に失敗しました"
        return 1
    fi
    
    if [ -z "$instance_info" ] || [ "$instance_info" = "None" ]; then
        print_error "タグ条件に一致するインスタンスが見つかりません: $env_name"
        return 1
    fi
    
    echo "$instance_info"
    return 0
}

# Get instance ID by tags
get_instance_id_by_tags() {
    local env_name=$1
    local aws_profile=${2:-"default"}
    local region=${3:-"ap-northeast-1"}
    
    # Define tag filters based on Environment
    local tag_filters=""
    case $env_name in
        "dev")
            tag_filters="Name=tag:Name,Values=*dev*bastion* Name=instance-state-name,Values=running"
            ;;
        "stg")
            tag_filters="Name=tag:Name,Values=*stg*bastion* Name=instance-state-name,Values=running"
            ;;
        "com")
            tag_filters="Name=tag:Name,Values=*com*bastion* Name=instance-state-name,Values=running"
            ;;
        *)
            tag_filters="Name=tag:Name,Values=*${env_name}* Name=instance-state-name,Values=running"
            ;;
    esac
    
    # Use AWS CLI to get instance ID
    local instance_id
    if [ "$aws_profile" = "default" ]; then
        instance_id=$(aws ec2 describe-instances \
            --region "$region" \
            --filters $tag_filters \
            --query 'Reservations[*].Instances[*].InstanceId' \
            --output text 2>/dev/null | head -n1)
    else
        instance_id=$(aws ec2 describe-instances \
            --profile "$aws_profile" \
            --region "$region" \
            --filters $tag_filters \
            --query 'Reservations[*].Instances[*].InstanceId' \
            --output text 2>/dev/null | head -n1)
    fi
    
    if [ $? -ne 0 ] || [ -z "$instance_id" ] || [ "$instance_id" = "None" ]; then
        print_error "タグ条件に一致するインスタンスIDが見つかりません: $env_name"
        return 1
    fi
    
    echo "$instance_id"
    return 0
}

# Get region by tags (search in common regions)
get_region_by_tags() {
    local env_name=$1
    local aws_profile=${2:-"default"}
    
    # Common regions to search
    local regions=("ap-northeast-1" "ap-northeast-2" "us-east-1" "us-west-2")
    
    for region in "${regions[@]}"; do
        if get_instance_id_by_tags "$env_name" "$aws_profile" "$region" > /dev/null 2>&1; then
            echo "$region"
            return 0
        fi
    done
    
    print_error "どのリージョンでもタグ条件に一致するインスタンスが見つかりません: $env_name"
    return 1
}

# =============================================================================
# Configuration Functions
# =============================================================================

# Get Environment configuration (enhanced with tag-based discovery)
get_env_config() {
    local env_name=$1
    local config_type=${2:-"all"}
    local aws_profile=${3:-"default"}
    local use_tags=${4:-"false"}
    
    # If use_tags is true, try tag-based discovery first
    if [ "$use_tags" = "true" ]; then
        local region
        local instance_id
        
        # Try to get region by tags
        if region=$(get_region_by_tags "$env_name" "$aws_profile"); then
            # Try to get instance ID by tags
            if instance_id=$(get_instance_id_by_tags "$env_name" "$aws_profile" "$region"); then
                case $config_type in
                    "instance_id")
                        echo "$instance_id"
                        ;;
                    "region")
                        echo "$region"
                        ;;
                    "all")
                        echo "$instance_id:$region"
                        ;;
                    *)
                        print_error "無効な設定タイプ: $config_type"
                        return 1
                        ;;
                esac
                return 0
            fi
        fi
        
        # Fall back to hardcoded config if tag-based discovery fails
        print_warning "タグベースの検索に失敗しました。ハードコードされた設定を使用します。"
    fi
    
    # Fallback to hardcoded configuration
    for config in "${ENV_CONFIGS[@]}"; do
        IFS=':' read -r env instance_id region <<< "$config"
        if [ "$env" = "$env_name" ]; then
            case $config_type in
                "instance_id")
                    echo "$instance_id"
                    ;;
                "region")
                    echo "$region"
                    ;;
                "all")
                    echo "$instance_id:$region"
                    ;;
                *)
                    print_error "無効な設定タイプ: $config_type"
                    return 1
                    ;;
            esac
            return 0
        fi
    done
    
    print_error "環境 $env_name の設定が見つかりません"
    return 1
}

# Get session configuration
get_session_config() {
    local session_name=$1
    local env_name=${2:-"com"}
    
    case $env_name in
        "com")
            for config in "${COM_SESSION_CONFIGS[@]}"; do
                IFS=':' read -r session remote_host remote_port local_port <<< "$config"
                if [ "$session" = "$session_name" ]; then
                    echo "$remote_host:$remote_port:$local_port"
                    return 0
                fi
            done
            ;;
        *)
            print_error "環境 $env_name のセッション設定が定義されていません"
            return 1
            ;;
    esac
    
    print_error "セッション $session_name の設定が見つかりません"
    return 1
}

# Get available Environments
get_available_Environments() {
    local envs=()
    for config in "${ENV_CONFIGS[@]}"; do
        IFS=':' read -r env instance_id region <<< "$config"
        envs+=("$env")
    done
    echo "${envs[@]}"
}

# Get available sessions
get_available_sessions() {
    local env_name=${1:-"com"}
    
    case $env_name in
        "com")
            local sessions=()
            for config in "${COM_SESSION_CONFIGS[@]}"; do
                IFS=':' read -r session remote_host remote_port local_port <<< "$config"
                sessions+=("$session")
            done
            echo "${sessions[@]}"
            ;;
        *)
            print_error "環境 $env_name のセッション設定が定義されていません"
            return 1
            ;;
    esac
}

# =============================================================================
# AWS Profile Management
# =============================================================================

# Get available AWS profiles
get_aws_profiles() {
    local profiles=($(aws configure list-profiles))
    if [ ${#profiles[@]} -eq 0 ]; then
        print_error "有効なAWSプロファイルが見つかりません"
        return 1
    fi
    echo "${profiles[@]}"
}

# Validate AWS profile
validate_aws_profile() {
    local profile=$1
    
    if aws configure list --profile "$profile" &> /dev/null; then
        print_success "AWSプロファイル $profile が有効です"
        return 0
    else
        print_error "無効なAWSプロファイル: $profile"
        return 1
    fi
}

# =============================================================================
# Interactive Selection Functions
# =============================================================================

# Interactive selection function
select_option() {
    local prompt=$1
    local options=("${@:2}")
    local selected=""
    
    echo "$prompt"
    select option in "${options[@]}"; do
        if [ -n "$option" ]; then
            selected="$option"
            break
        else
            print_warning "無効な選択です。再度お試しください。"
        fi
    done
    
    echo "$selected"
}

# Select Environment interactively
select_Environment() {
    local envs=($(get_available_Environments))
    select_option "-- 環境を選択してください:" "${envs[@]}"
}

# Select session interactively
select_session() {
    local env_name=$1
    local sessions=($(get_available_sessions "$env_name"))
    select_option "-- 開始するセッションを選択してください:" "${sessions[@]}"
}

# Select AWS profile interactively
select_aws_profile() {
    local profiles=($(get_aws_profiles))
    select_option "-- AWSプロファイルを選択してください:" "${profiles[@]}"
}

# =============================================================================
# Configuration Validation
# =============================================================================

# Validate complete configuration
validate_configuration() {
    local env_name=$1
    local session_name=$2
    local aws_profile=$3
    
    print_info "設定を検証中..."
    
    # Validate Environment
    if ! get_env_config "$env_name" > /dev/null; then
        return 1
    fi
    
    # Validate session
    if ! get_session_config "$session_name" "$env_name" > /dev/null; then
        return 1
    fi
    
    # Validate AWS profile
    if ! validate_aws_profile "$aws_profile"; then
        return 1
    fi
    
    print_success "設定の検証が完了しました"
    return 0
}

# =============================================================================
# Export Functions
# =============================================================================

# Export all functions
export -f get_env_config get_session_config
export -f get_available_Environments get_available_sessions
export -f get_aws_profiles validate_aws_profile
export -f select_option select_Environment select_session select_aws_profile
export -f validate_configuration
export -f find_instance_by_tags get_instance_id_by_tags get_region_by_tags
