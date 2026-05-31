#!/bin/bash

# =============================================================================
# EKS Session Manager Script
# =============================================================================

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common/colors.sh"
source "${SCRIPT_DIR}/common/aws-ssm.sh"
source "${SCRIPT_DIR}/common/config.sh"

# =============================================================================
# Session Execution Functions
# =============================================================================

# Execute session based on selection
execute_session() {
    local session_name=$1
    local env_name=$2
    local aws_profile=$3
    local instance_id=$4
    
    print_info "セッションを開始中: $session_name"
    
    # Get session configuration
    local session_config=$(get_session_config "$session_name" "$env_name")
    if [ $? -ne 0 ]; then
        print_error "セッション設定の取得に失敗しました"
        return 1
    fi
    
    IFS=':' read -r remote_host remote_port local_port <<< "$session_config"
    
    # Set AWS profile
    export AWS_PROFILE="$aws_profile"
    
    # Execute session based on type
    case $session_name in
        "prometheus_sbx_hmile")
            print_warning "Please connect after running port-forward command in bastion server"
            print_info "Starting Prometheus SBX session: $remote_host:$local_port"
            start_local_port_forwarding_session "$instance_id" "$remote_port" "$local_port"
            ;;
        *)
            print_info "Starting $session_name session: $remote_host:$local_port"
            start_port_forwarding_session "$instance_id" "$remote_host" "$remote_port" "$local_port"
            ;;
    esac
}



# =============================================================================
# Main Execution Flow
# =============================================================================

main() {
    print_info "EKS Session Manager Starting..."
    
    # Select AWS profile
    local selected_profile=$(select_aws_profile)
    if [ -z "$selected_profile" ]; then
        print_error "AWSプロファイルの選択に失敗しました"
        exit 1
    fi
    print_success "Selected profile: [$selected_profile]"
    
    # Select Environment
    local selected_env=$(select_Environment)
    if [ -z "$selected_env" ]; then
        print_error "環境の選択に失敗しました"
        exit 1
    fi
    print_success "Selected Environment: [$selected_env]"
    
    # Get instance ID for selected Environment
    local instance_id=$(get_env_config "$selected_env" "instance_id")
    if [ -z "$instance_id" ]; then
        print_error "Invalid Environment: $selected_env"
        exit 1
    fi
    
    # Select session
    local selected_session=$(select_session "$selected_env")
    if [ -z "$selected_session" ]; then
        print_error "セッションの選択に失敗しました"
        exit 1
    fi
    print_success "Selected session: [$selected_session]"
    
    # Validate configuration
    if ! validate_configuration "$selected_env" "$selected_session" "$selected_profile"; then
        print_error "設定の検証に失敗しました"
        exit 1
    fi
    
    # Execute selected session
    execute_session "$selected_session" "$selected_env" "$selected_profile" "$instance_id"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi