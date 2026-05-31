#!/bin/bash
# タグベース検索機能のテストスクリプト

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common/colors.sh"
source "${SCRIPT_DIR}/common/config.sh"

# =============================================================================
# Test Functions
# =============================================================================

test_tag_discovery() {
    local env_name=$1
    local aws_profile=${2:-"default"}
    
    print_info "=== タグベース検索テスト: $env_name ==="
    
    # Test instance discovery by tags
    print_info "1. インスタンス情報の取得（タグベース）..."
    local instance_info
    if instance_info=$(find_instance_by_tags "$env_name" "$aws_profile"); then
        print_success "インスタンス情報取得成功:"
        echo "$instance_info"
    else
        print_error "インスタンス情報取得失敗"
        return 1
    fi
    
    # Test instance ID retrieval by tags
    print_info "2. インスタンスIDの取得（タグベース）..."
    local instance_id
    if instance_id=$(get_instance_id_by_tags "$env_name" "$aws_profile"); then
        print_success "インスタンスID取得成功: $instance_id"
    else
        print_error "インスタンスID取得失敗"
        return 1
    fi
    
    # Test region discovery by tags
    print_info "3. リージョンの取得（タグベース）..."
    local region
    if region=$(get_region_by_tags "$env_name" "$aws_profile"); then
        print_success "リージョン取得成功: $region"
    else
        print_error "リージョン取得失敗"
        return 1
    fi
    
    # Test enhanced get_env_config with tags
    print_info "4. 拡張get_env_config（タグベース）..."
    local config
    if config=$(get_env_config "$env_name" "all" "$aws_profile" "true"); then
        print_success "設定取得成功: $config"
    else
        print_error "設定取得失敗"
        return 1
    fi
    
    print_success "=== タグベース検索テスト完了: $env_name ==="
    return 0
}

test_fallback_config() {
    local env_name=$1
    local aws_profile=${2:-"default"}
    
    print_info "=== フォールバック設定テスト: $env_name ==="
    
    # Test fallback to hardcoded config
    print_info "1. ハードコードされた設定の取得..."
    local config
    if config=$(get_env_config "$env_name" "all" "$aws_profile" "false"); then
        print_success "ハードコードされた設定取得成功: $config"
    else
        print_error "ハードコードされた設定取得失敗"
        return 1
    fi
    
    print_success "=== フォールバック設定テスト完了: $env_name ==="
    return 0
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_info "タグベース検索機能のテストを開始します..."
    
    # Parse command line arguments
    local env_name="dev"
    local aws_profile="default"
    local test_type="all"
    
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
            --test-type)
                test_type="$2"
                shift 2
                ;;
            --help)
                echo "使用方法: $0 [--env ENV] [--profile PROFILE] [--test-type TYPE]"
                echo "  --env ENV       環境名 (dev, stg, com) [デフォルト: dev]"
                echo "  --profile PROFILE AWSプロファイル [デフォルト: default]"
                echo "  --test-type TYPE テストタイプ (tags, fallback, all) [デフォルト: all]"
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
    print_info "テストタイプ: $test_type"
    
    # Run tests based on test type
    case $test_type in
        "tags")
            test_tag_discovery "$env_name" "$aws_profile"
            ;;
        "fallback")
            test_fallback_config "$env_name" "$aws_profile"
            ;;
        "all")
            test_tag_discovery "$env_name" "$aws_profile"
            if [ $? -eq 0 ]; then
                echo
                test_fallback_config "$env_name" "$aws_profile"
            fi
            ;;
        *)
            print_error "無効なテストタイプ: $test_type"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "すべてのテストが完了しました"
    else
        print_error "テストが失敗しました"
        exit 1
    fi
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
