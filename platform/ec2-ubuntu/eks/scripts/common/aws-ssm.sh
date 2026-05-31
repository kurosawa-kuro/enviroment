#!/bin/bash

# =============================================================================
# AWS SSM Session Management Functions
# =============================================================================
# このスクリプトはAWS SSMセッション管理の共通機能を提供します

# Source common color functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/colors.sh"

# =============================================================================
# Configuration
# =============================================================================

# Default AWS region
readonly DEFAULT_REGION="ap-northeast-1"

# =============================================================================
# Validation Functions
# =============================================================================

# Check if expect command is available
check_expect_command() {
    if ! command -v expect &> /dev/null; then
        print_error "expectコマンドがインストールされていません。"
        print_info "以下のコマンドでインストールしてください:"
        print_info "sudo apt-get update && sudo apt-get install -y expect"
        return 1
    fi
    return 0
}

# Validate AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLIがインストールされていません。"
        print_info "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html からインストールしてください"
        return 1
    fi
    return 0
}

# Validate instance ID format
validate_instance_id() {
    local instance_id=$1
    if [[ ! $instance_id =~ ^i-[a-f0-9]{8,17}$ ]]; then
        print_error "無効なインスタンスID形式です: $instance_id"
        return 1
    fi
    return 0
}

# =============================================================================
# SSM Session Functions
# =============================================================================

# Start basic SSM session
start_ssm_session() {
    local instance_id=$1
    local region=${2:-$DEFAULT_REGION}
    
    print_info "SSMセッションを開始中..."
    print_info "Instance ID: $instance_id"
    print_info "Region: $region"
    
    # Validation
    if ! validate_instance_id "$instance_id"; then
        return 1
    fi
    
    if ! check_aws_cli; then
        return 1
    fi
    
    # Start session
    aws ssm start-session --target "$instance_id" --region "$region"
}

# Start SSM session with automatic user switch
start_ssm_session_with_user_switch() {
    local instance_id=$1
    local region=${2:-$DEFAULT_REGION}
    local target_user=${3:-"ubuntu"}
    local aws_profile=${4:-"default"}
    
    print_info "SSMセッションを開始中（自動ユーザー切り替え）..."
    print_info "Instance ID: $instance_id"
    print_info "Region: $region"
    print_info "Target User: $target_user"
    print_info "AWS Profile: $aws_profile"
    
    # Validation
    if ! validate_instance_id "$instance_id"; then
        return 1
    fi
    
    if ! check_aws_cli; then
        return 1
    fi
    
    if ! check_expect_command; then
        return 1
    fi
    
    # Build AWS CLI command with profile if specified
    local aws_cmd="aws ssm start-session --target \"$instance_id\" --region \"$region\""
    if [ "$aws_profile" != "default" ]; then
        aws_cmd="aws ssm start-session --profile \"$aws_profile\" --target \"$instance_id\" --region \"$region\""
    fi
    
    # Start session with expect script
    expect -c "
set timeout 30
spawn $aws_cmd

expect {
    \"Starting session with SessionId\" {
        expect {
            \"$ \" {
                send \"sudo su - $target_user\\r\"
                interact
            }
            timeout {
                puts \"プロンプトが検出できませんでした\"
                interact
            }
        }
    }
    timeout {
        puts \"SSMセッション開始がタイムアウトしました\"
        exit 1
    }
}
"
}

# Start port forwarding session
start_port_forwarding_session() {
    local instance_id=$1
    local remote_host=$2
    local remote_port=$3
    local local_port=$4
    local region=${5:-$DEFAULT_REGION}
    
    print_info "ポートフォワーディングセッションを開始中..."
    print_info "Instance ID: $instance_id"
    print_info "Remote Host: $remote_host"
    print_info "Remote Port: $remote_port"
    print_info "Local Port: $local_port"
    print_info "Region: $region"
    
    # Validation
    if ! validate_instance_id "$instance_id"; then
        return 1
    fi
    
    if ! check_aws_cli; then
        return 1
    fi
    
    # Start port forwarding session
    aws ssm start-session \
        --target "$instance_id" \
        --document-name AWS-StartPortForwardingSessionToRemoteHost \
        --region "$region" \
        --parameters "{\"host\":[\"$remote_host\"],\"portNumber\":[\"$remote_port\"],\"localPortNumber\":[\"$local_port\"]}"
}

# Start local port forwarding session
start_local_port_forwarding_session() {
    local instance_id=$1
    local remote_port=$2
    local local_port=$3
    local region=${4:-$DEFAULT_REGION}
    
    print_info "ローカルポートフォワーディングセッションを開始中..."
    print_info "Instance ID: $instance_id"
    print_info "Remote Port: $remote_port"
    print_info "Local Port: $local_port"
    print_info "Region: $region"
    
    # Validation
    if ! validate_instance_id "$instance_id"; then
        return 1
    fi
    
    if ! check_aws_cli; then
        return 1
    fi
    
    # Start local port forwarding session
    aws ssm start-session \
        --target "$instance_id" \
        --document-name AWS-StartPortForwardingSession \
        --region "$region" \
        --parameters "{\"portNumber\":[\"$remote_port\"], \"localPortNumber\":[\"$local_port\"]}"
}

# =============================================================================
# Utility Functions
# =============================================================================

# List available instances
list_instances() {
    local region=${1:-$DEFAULT_REGION}
    
    print_info "利用可能なインスタンスを取得中..."
    
    if ! check_aws_cli; then
        return 1
    fi
    
    aws ec2 describe-instances \
        --region "$region" \
        --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,Tags[?Key==`Name`].Value|[0]]' \
        --output table
}

# =============================================================================
# Export Functions
# =============================================================================

# Export all functions
export -f check_expect_command check_aws_cli validate_instance_id
export -f start_ssm_session start_ssm_session_with_user_switch
export -f start_port_forwarding_session start_local_port_forwarding_session
export -f list_instances
