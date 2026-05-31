# Common Functions Library

このディレクトリには、EKSインフラストラクチャ管理スクリプトで使用される共通関数が含まれています。

## ファイル構成

### `colors.sh`
色付きログ出力機能を提供します。

**主要な関数:**
- `print_info(message)` - 情報メッセージ
- `print_success(message)` - 成功メッセージ
- `print_error(message)` - エラーメッセージ
- `print_warning(message)` - 警告メッセージ
- `print_header(title)` - セクションヘッダー
- `print_subsection(title)` - サブセクションヘッダー

### `aws-resources.sh`
AWSリソースのチェック機能を提供します。

**主要な関数:**
- `check_stack_status(stack_name, region)` - CloudFormationスタックの状態確認
- `get_stack_output(stack_name, output_key, region)` - スタック出力の取得
- `check_ec2_instance(instance_id, region)` - EC2インスタンスの状態確認
- `check_vpc_status(vpc_id, region)` - VPCの状態確認
- `check_s3_bucket_access(bucket_name, region)` - S3バケットのアクセス確認
- `check_eks_cluster_status(cluster_name, region)` - EKSクラスターの状態確認

### `validation.sh`
バリデーション機能を提供します。

**主要な関数:**
- `validate_resource(resource_name, resource_value, success_message, error_message)` - リソース存在確認
- `validate_status(resource_name, status_value, expected_status, success_message, error_message)` - ステータス確認
- `init_check_counters()` - チェックカウンターの初期化
- `add_check_result(passed)` - チェック結果の追加
- `print_summary(service_name)` - サマリーの表示

### `logging.sh`
ログ機能を提供します。

**主要な関数:**
- `log_info(message)` - 情報ログ
- `log_warn(message)` - 警告ログ
- `log_error(message)` - エラーログ
- `log_step(message)` - ステップログ
- `set_log_file(log_file)` - ログファイルの設定

### `utils.sh`
ユーティリティ機能を提供します。

**主要な関数:**
- `init_script_config(script_dir, project_root, work_dir, log_file)` - スクリプト設定の初期化
- `check_prerequisites()` - 前提条件チェック
- `execute_make_command(command, description)` - Makefileコマンド実行
- `script_exit(exit_code, script_name)` - スクリプト終了処理

### `discord-notification.sh`
Discord通知機能を提供します。

**主要な関数:**
- `send_discord_notification(status, message, color, title_prefix)` - Discord通知送信
- `send_success_notification(message, title_prefix)` - 成功通知
- `send_error_notification(message, title_prefix)` - エラー通知
- `send_warning_notification(message, title_prefix)` - 警告通知

## 使用方法

### 基本的な使用方法

```bash
#!/bin/bash

# 共通ファイルを読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common/colors.sh"
source "${SCRIPT_DIR}/common/aws-resources.sh"
source "${SCRIPT_DIR}/common/validation.sh"

# 使用例
print_header "My Script"
print_info "Starting process..."

# AWSリソースのチェック
stack_status=$(check_stack_status "my-stack" "ap-northeast-1")
if validate_stack_status "$stack_status" "my-stack"; then
    print_success "Stack is ready"
else
    print_error "Stack is not ready"
fi
```

### チェックスクリプトでの使用例

```bash
#!/bin/bash

# 共通ファイルを読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/colors.sh"
source "${SCRIPT_DIR}/../common/aws-resources.sh"
source "${SCRIPT_DIR}/../common/validation.sh"

# チェックカウンターの初期化
init_check_counters

# リソースチェック
resource_value=$(get_stack_output "my-stack" "ResourceId" "ap-northeast-1")
if validate_resource "My Resource" "$resource_value" "Resource found" "Resource not found"; then
    add_check_result "true"
else
    add_check_result "false"
fi

# サマリー表示
print_summary "My Service"
```

### ワークフロースクリプトでの使用例

```bash
#!/bin/bash

# 共通ファイルを読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/logging.sh"
source "${SCRIPT_DIR}/../common/utils.sh"
source "${SCRIPT_DIR}/../common/discord-notification.sh"

# スクリプト設定の初期化
init_script_config "$SCRIPT_DIR" "$PROJECT_ROOT" "$WORK_DIR" "$LOG_FILE"

# 前提条件チェック
if ! check_prerequisites; then
    log_error "Prerequisites check failed"
    send_error_notification "Prerequisites check failed"
    script_exit 1 "My Script"
fi

# 処理実行
log_step "Starting main process"
if execute_make_command "deploy" "Deploying resources"; then
    send_success_notification "Deployment completed successfully"
    script_exit 0 "My Script"
else
    send_error_notification "Deployment failed"
    script_exit 1 "My Script"
fi
```

## 移行ガイド

### 既存のスクリプトからの移行

1. **色付きログ出力の移行**
   ```bash
   # 旧方式
   echo -e "${GREEN}[INFO]${NC} $message"
   
   # 新方式
   source "${SCRIPT_DIR}/common/colors.sh"
   print_info "$message"
   ```

2. **AWSリソースチェックの移行**
   ```bash
   # 旧方式
   aws cloudformation describe-stacks --stack-name "$stack_name" --query 'Stacks[0].StackStatus' --output text
   
   # 新方式
   source "${SCRIPT_DIR}/common/aws-resources.sh"
   check_stack_status "$stack_name" "$region"
   ```

3. **バリデーションの移行**
   ```bash
   # 旧方式
   if [ -n "$resource_value" ]; then
       echo "Resource found"
   else
       echo "Resource not found"
   fi
   
   # 新方式
   source "${SCRIPT_DIR}/common/validation.sh"
   validate_resource "Resource" "$resource_value" "Resource found" "Resource not found"
   ```

## 注意事項

- 既存の`common-functions.sh`は後方互換性のため残されていますが、新しいスクリプトでは直接新しい共通ファイルを使用することを推奨します。
- 共通ファイルは依存関係があるため、読み込み順序に注意してください。
- 新しい関数を追加する場合は、適切な共通ファイルに配置し、このREADMEを更新してください。
