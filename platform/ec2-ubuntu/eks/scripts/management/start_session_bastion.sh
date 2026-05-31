#!/bin/bash
# WSLからセッションマネージャーでEC2踏み台に接続し、自動的にubuntuユーザーに切り替える

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common/colors.sh"
source "${SCRIPT_DIR}/common/aws-ssm.sh"
source "${SCRIPT_DIR}/common/config.sh"

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_info "EC2踏み台サーバーへの接続を開始します..."
    
    # Parse command line arguments
    local env_name="dev"
    local aws_profile="default"
    local use_tags="true"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                env_name="$2"
                shift 2
                ;;
            --profile)
                aws_profile="$2"
                shift 2
                ;;
            --no-tags)
                use_tags="false"
                shift
                ;;
            --help)
                echo "使用方法: $0 [--env ENV] [--profile PROFILE] [--no-tags]"
                echo "  --env ENV       環境名 (dev, stg, com) [デフォルト: dev]"
                echo "  --profile PROFILE AWSプロファイル [デフォルト: default]"
                echo "  --no-tags       タグベース検索を無効にしてハードコードされた設定を使用"
                echo "  --help          このヘルプメッセージを表示"
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                echo "使用方法: $0 --help"
                exit 1
                ;;
        esac
    done
    
    print_info "環境: $env_name"
    print_info "AWSプロファイル: $aws_profile"
    print_info "タグベース検索: $use_tags"
    
    # Get instance ID using tag-based discovery or fallback to hardcoded config
    local instance_id
    if [ "$use_tags" = "true" ]; then
        print_info "タグベースでインスタンスを検索中..."
        instance_id=$(get_env_config "$env_name" "instance_id" "$aws_profile" "true")
    else
        print_info "ハードコードされた設定を使用中..."
        instance_id=$(get_env_config "$env_name" "instance_id" "$aws_profile" "false")
    fi
    
    if [ -z "$instance_id" ]; then
        print_error "${env_name}環境のインスタンスIDが見つかりません"
        exit 1
    fi
    
    # Get region using tag-based discovery or fallback to hardcoded config
    local region
    if [ "$use_tags" = "true" ]; then
        region=$(get_env_config "$env_name" "region" "$aws_profile" "true")
    else
        region=$(get_env_config "$env_name" "region" "$aws_profile" "false")
    fi
    
    if [ -z "$region" ]; then
        print_error "${env_name}環境のリージョン設定が見つかりません"
        exit 1
    fi
    
    print_info "Instance ID: $instance_id"
    print_info "Region: $region"
    print_info "自動的にubuntuユーザーに切り替えます..."
    
    # Start SSM session with user switch
    start_ssm_session_with_user_switch "$instance_id" "$region" "ubuntu" "$aws_profile"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi