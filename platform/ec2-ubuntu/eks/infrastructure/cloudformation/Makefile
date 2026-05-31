# =============================================================================
# CloudFormation Infrastructure Makefile
# =============================================================================
# 命名規則: cloudformation命名規則.md に準拠
# =============================================================================

# 設定ファイル
CONFIG_FILE = config.yaml

# yqを使用してYAMLから値を読み込む関数
get_config = $(shell yq eval '.$(1)' $(CONFIG_FILE))

# 基本設定値を取得
PROJECT_NAME_RAW = $(call get_config,basic.ProjectName)
VERSION_RAW = $(call get_config,basic.Version)

# スタック名を展開する関数
expand_stack_name = $(shell echo '$(1)' | sed 's/\$${basic\.ProjectName}/$(PROJECT_NAME_RAW)/g' | sed 's/\$${basic\.Version}/$(VERSION_RAW)/g')

# 基本設定（PascalCase → kebab-case変換）
AwsRegion = $(call get_config,basic.AwsRegion)
CLUSTER_NAME = $(call get_config,basic.ClusterName)
ProjectName = $(call get_config,basic.ProjectName)
Environment = $(call get_config,basic.Environment)
VERSION = $(call get_config,basic.Version)
OWNER = $(call get_config,basic.Owner)

# スタック名（kebab-case統一）
CLEANUP_STACK = $(call expand_stack_name,$(call get_config,Stacks.Cleanup))
PREREQUISITES_STACK = $(call expand_stack_name,$(call get_config,Stacks.Prerequisites))
IAM_ROLE_STACK = $(call expand_stack_name,$(call get_config,Stacks.IamRole))
NETWORK_STACK = $(call expand_stack_name,$(call get_config,Stacks.Network))
ALB_STACK = $(call expand_stack_name,$(call get_config,Stacks.ALB))
EKS_CLUSTER_STACK = $(call expand_stack_name,$(call get_config,Stacks.Platform))
BASTION_STACK = $(call expand_stack_name,$(call get_config,Stacks.Bastion))

# テンプレートファイル
PREREQUISITES_TEMPLATE = $(call get_config,Templates.Prerequisites)
IAM_ROLE_TEMPLATE = $(call get_config,Templates.IamRole)
NETWORK_TEMPLATE = $(call get_config,Templates.Network)
ALB_TEMPLATE = $(call get_config,Templates.ALB)
EKS_TEMPLATE = $(call get_config,Templates.Platform)
BASTION_TEMPLATE = $(call get_config,Templates.Bastion)

# パラメータ設定（kebab-case統一）
# Network parameters
VPC_CIDR = $(call get_config,Parameters.Network.VpcCidr)
PUBLIC_SUBNET_1_CIDR = $(call get_config,Parameters.Network.PublicSubnet1Cidr)
PUBLIC_SUBNET_2_CIDR = $(call get_config,Parameters.Network.PublicSubnet2Cidr)
PRIVATE_SUBNET_1_CIDR = $(call get_config,Parameters.Network.PrivateSubnet1Cidr)
PRIVATE_SUBNET_2_CIDR = $(call get_config,Parameters.Network.PrivateSubnet2Cidr)
ENABLE_NAT_GATEWAY = $(call get_config,Parameters.Network.EnableNatGateway)

# S3 parameters
BUCKET_PREFIX = $(call get_config,Parameters.S3.BucketPrefix)
ENABLE_VERSIONING = $(call get_config,Parameters.S3.EnableVersioning)
ENABLE_ENCRYPTION = $(call get_config,Parameters.S3.EnableEncryption)

# Security parameters
ENABLE_KMS_ENCRYPTION = $(call get_config,Parameters.Security.EnableKmsEncryption)

# ECR parameters
ECR_REPOSITORY_NAME = $(call expand_stack_name,$(call get_config,Parameters.ECR.RepositoryName))

# EKS parameters
KUBERNETES_VERSION = $(call get_config,Parameters.EKS.KubernetesVersion)
NODE_INSTANCE_TYPE = $(call get_config,Parameters.EKS.NodeInstanceType)
NODE_GROUP_MIN_SIZE = $(call get_config,Parameters.EKS.NodeGroupMinSize)
NODE_GROUP_DESIRED_SIZE = $(call get_config,Parameters.EKS.NodeGroupDesiredSize)
NODE_GROUP_MAX_SIZE = $(call get_config,Parameters.EKS.NodeGroupMaxSize)

# Bastion parameters
BASTION_INSTANCE_TYPE = $(call get_config,Parameters.Bastion.InstanceType)

# PHONY targets（kebab-case統一）
.PHONY: deploy-all deploy-01-prerequisites deploy-02-iam-role deploy-03-network deploy-04-alb deploy-04-eks deploy-06-bastion \
	destroy destroy-bastion destroy-eks-platform destroy-alb destroy-network destroy-iam-role destroy-prerequisites \
	connect check-01-prerequisites check-02-iam-role check-03-network check-04-alb check-05-eks check-06-bastion check-all \
	cleanup-resources cleanup-after-destroy check-cleanup-resources cleanup-and-verify cleanup-after-destroy-and-verify \
	workflow-run-01-03 workflow-run-04 workflow-run-05 workflow-run-06 workflow-destroy \
	workflow-bastion workflow-destroy-bastion workflow-eks workflow-destroy-eks \
	status-eks status-all

# =============================================================================
# CloudFormation デプロイメントコマンド
# =============================================================================
deploy-all:
	aws cloudformation deploy --stack-name $(PREREQUISITES_STACK) --template-file $(PREREQUISITES_TEMPLATE) --parameter-overrides Environment=$(Environment) Project=$(ProjectName) Owner=$(OWNER) BucketPrefix=$(BUCKET_PREFIX) EnableVersioning=$(ENABLE_VERSIONING) EnableEncryption=$(ENABLE_ENCRYPTION) EnableKMSEncryption=$(ENABLE_KMS_ENCRYPTION) ECRRepositoryName=$(ECR_REPOSITORY_NAME) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)
	aws cloudformation deploy --stack-name $(NETWORK_STACK) --template-file $(NETWORK_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) Environment=$(Environment) Project=$(ProjectName) Owner=$(OWNER) VpcCidrBlock=$(VPC_CIDR) PublicSubnet1Cidr=$(PUBLIC_SUBNET_1_CIDR) PublicSubnet2Cidr=$(PUBLIC_SUBNET_2_CIDR) PrivateSubnet1Cidr=$(PRIVATE_SUBNET_1_CIDR) PrivateSubnet2Cidr=$(PRIVATE_SUBNET_2_CIDR) EnableNatGateway=$(ENABLE_NAT_GATEWAY) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)
	aws cloudformation deploy --stack-name $(ALB_STACK) --template-file $(ALB_TEMPLATE) --parameter-overrides NetworkStackName=$(NETWORK_STACK) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)
	aws cloudformation deploy --stack-name $(EKS_CLUSTER_STACK) --template-file $(EKS_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) NetworkStackName=$(NETWORK_STACK) ClusterName=$(CLUSTER_NAME) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) KubernetesVersion=$(KUBERNETES_VERSION) NodeInstanceType=$(NODE_INSTANCE_TYPE) NodeGroupMinSize=$(NODE_GROUP_MIN_SIZE) NodeGroupDesiredSize=$(NODE_GROUP_DESIRED_SIZE) NodeGroupMaxSize=$(NODE_GROUP_MAX_SIZE) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)
	aws cloudformation deploy --stack-name $(BASTION_STACK) --template-file $(BASTION_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) NetworkStackName=$(NETWORK_STACK) EKSClusterStackName=$(EKS_CLUSTER_STACK) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) BastionInstanceType=$(BASTION_INSTANCE_TYPE) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)

deploy-01-prerequisites:
	aws cloudformation deploy --stack-name $(PREREQUISITES_STACK) --template-file $(PREREQUISITES_TEMPLATE) --parameter-overrides Environment=$(Environment) Project=$(ProjectName) Owner=$(OWNER) BucketPrefix=$(BUCKET_PREFIX) EnableVersioning=$(ENABLE_VERSIONING) EnableEncryption=$(ENABLE_ENCRYPTION) EnableKMSEncryption=$(ENABLE_KMS_ENCRYPTION) ECRRepositoryName=$(ECR_REPOSITORY_NAME) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)

deploy-02-iam-role:
	aws cloudformation deploy --stack-name $(IAM_ROLE_STACK) --template-file $(IAM_ROLE_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)

deploy-03-network:
	aws cloudformation deploy --stack-name $(NETWORK_STACK) --template-file $(NETWORK_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) Environment=$(Environment) Project=$(ProjectName) Owner=$(OWNER) VpcCidrBlock=$(VPC_CIDR) PublicSubnet1Cidr=$(PUBLIC_SUBNET_1_CIDR) PublicSubnet2Cidr=$(PUBLIC_SUBNET_2_CIDR) PrivateSubnet1Cidr=$(PRIVATE_SUBNET_1_CIDR) PrivateSubnet2Cidr=$(PRIVATE_SUBNET_2_CIDR) EnableNatGateway=$(ENABLE_NAT_GATEWAY) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)

deploy-04-alb:
	aws cloudformation deploy --stack-name $(ALB_STACK) --template-file $(ALB_TEMPLATE) --parameter-overrides NetworkStackName=$(NETWORK_STACK) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)

deploy-04-eks:
	aws cloudformation deploy --stack-name $(EKS_CLUSTER_STACK) --template-file $(EKS_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) NetworkStackName=$(NETWORK_STACK) ALBStackName=$(ALB_STACK) ClusterName=$(CLUSTER_NAME) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) KubernetesVersion=$(KUBERNETES_VERSION) NodeInstanceType=$(NODE_INSTANCE_TYPE) NodeGroupMinSize=$(NODE_GROUP_MIN_SIZE) NodeGroupDesiredSize=$(NODE_GROUP_DESIRED_SIZE) NodeGroupMaxSize=$(NODE_GROUP_MAX_SIZE) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)

deploy-06-bastion:
	aws cloudformation deploy --stack-name $(BASTION_STACK) --template-file $(BASTION_TEMPLATE) --parameter-overrides PrerequisitesStackName=$(PREREQUISITES_STACK) NetworkStackName=$(NETWORK_STACK) EKSClusterStackName=$(EKS_CLUSTER_STACK) Environment=$(Environment) Project=$(ProjectName) Version=$(VERSION) Owner=$(OWNER) BastionInstanceType=$(BASTION_INSTANCE_TYPE) --capabilities CAPABILITY_NAMED_IAM --region $(AwsRegion)




# =============================================================================
# CloudFormation 削除コマンド
# =============================================================================
destroy:
	aws cloudformation delete-stack --stack-name $(BASTION_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(BASTION_STACK) --region $(AwsRegion)
	aws cloudformation delete-stack --stack-name $(EKS_CLUSTER_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(EKS_CLUSTER_STACK) --region $(AwsRegion)
	aws cloudformation delete-stack --stack-name $(ALB_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(ALB_STACK) --region $(AwsRegion)
	aws cloudformation delete-stack --stack-name $(NETWORK_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(NETWORK_STACK) --region $(AwsRegion)
	aws cloudformation delete-stack --stack-name $(IAM_ROLE_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(IAM_ROLE_STACK) --region $(AwsRegion)
	aws cloudformation delete-stack --stack-name $(PREREQUISITES_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(PREREQUISITES_STACK) --region $(AwsRegion)
	# クリーンアップリソースがある場合は削除
	-aws cloudformation delete-stack --stack-name $(CLEANUP_STACK) --region $(AwsRegion)
	-aws cloudformation wait stack-delete-complete --stack-name $(CLEANUP_STACK) --region $(AwsRegion)

# 個別スタック削除
destroy-bastion:
	aws cloudformation delete-stack --stack-name $(BASTION_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(BASTION_STACK) --region $(AwsRegion)

# EKSクラスター強制削除（確認なし・強制オプション付き）
# EKSクラスター強制削除（EC2まで確実に削除）
destroy-eks-platform:
	@echo "Force deleting all EKS resources..."
	# ノードグループ全削除（--forceオプション付与）
	-@for ng in $$(aws eks list-nodegroups --cluster-name $(CLUSTER_NAME) --region $(AwsRegion) --query 'nodegroups[]' --output text 2>/dev/null); do \
		echo "Force deleting nodegroup: $$ng"; \
		aws eks delete-nodegroup --cluster-name $(CLUSTER_NAME) --nodegroup-name $$ng --region $(AwsRegion) --force --no-cli-pager --output text 2>/dev/null; \
	done
	# Auto Scaling Groups 強制削除
	-@for asg in $$(aws autoscaling describe-auto-scaling-groups --region $(AwsRegion) --query "AutoScalingGroups[?contains(AutoScalingGroupName, '$(CLUSTER_NAME)')].AutoScalingGroupName" --output text 2>/dev/null); do \
		echo "Force deleting Auto Scaling Group: $$asg"; \
		aws autoscaling delete-auto-scaling-group --auto-scaling-group-name $$asg --region $(AwsRegion) --force-delete --no-cli-pager 2>/dev/null; \
	done
	# EC2 インスタンス強制終了（ノードグループ/ASGに残っているものを terminate）
	-@for inst in $$(aws ec2 describe-instances --region $(AwsRegion) \
		--filters "Name=tag:eks:cluster-name,Values=$(CLUSTER_NAME)" \
		--query "Reservations[].Instances[].InstanceId" --output text 2>/dev/null); do \
		echo "Terminating EC2 instance: $$inst"; \
		aws ec2 terminate-instances --instance-ids $$inst --region $(AwsRegion) --no-cli-pager --output text 2>/dev/null; \
	done
	# クラスター削除
	-@aws eks delete-cluster --name $(CLUSTER_NAME) --region $(AwsRegion) --no-cli-pager --output text 2>/dev/null
	# CloudFormationスタック削除（依存リソース残っていても実行）
	-@aws cloudformation delete-stack --stack-name $(EKS_CLUSTER_STACK) --region $(AwsRegion) --no-cli-pager --output text 2>/dev/null
	# 強制削除完了
	@echo "EKS cluster, nodegroups, Auto Scaling Groups, EC2 instances, and CloudFormation stack force deletion commands executed."



destroy-alb:
	aws cloudformation delete-stack --stack-name $(ALB_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(ALB_STACK) --region $(AwsRegion)

destroy-network:
	aws cloudformation delete-stack --stack-name $(NETWORK_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(NETWORK_STACK) --region $(AwsRegion)

destroy-iam-role:
	aws cloudformation delete-stack --stack-name $(IAM_ROLE_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(IAM_ROLE_STACK) --region $(AwsRegion)

destroy-prerequisites:
	aws cloudformation delete-stack --stack-name $(PREREQUISITES_STACK) --region $(AwsRegion)
	aws cloudformation wait stack-delete-complete --stack-name $(PREREQUISITES_STACK) --region $(AwsRegion)

# =============================================================================
# 接続コマンド
# =============================================================================
connect:
	aws ssm start-session --target $$(aws cloudformation describe-stacks --stack-name $(BASTION_STACK) --region $(AwsRegion) --query 'Stacks[0].Outputs[?OutputKey==`BastionInstanceId`].OutputValue' --output text) --region $(AwsRegion)

# =============================================================================
# スタック状態確認コマンド
# =============================================================================

# 個別スタックチェック
check-01-prerequisites:
	@node ./scripts/check/check-01-prerequisites.js

check-02-iam-role:
	@node ./scripts/check/check-02-iam-role.js

check-03-network:
	@node ./scripts/check/check-03-network.js

check-04-alb:
	@node ./scripts/check/check-05-alb.js

check-05-eks:
	@node ./scripts/check/check-04-eks-cluster.js

check-06-bastion:
	@node ./scripts/check/check-06-bastion.js

# 全スタックチェック
check-all:
	@node ./scripts/check/check-01-06-all.js

# エイリアス (後方互換性のため)
check-prerequisites: check-01-prerequisites
check-iam-role: check-02-iam-role
check-network: check-03-network
check-alb: check-04-alb
check-eks-platform: check-05-eks
check-bastion: check-06-bastion

# =============================================================================
# リソースクリーンアップコマンド
# =============================================================================

# クリーンアップリソースの検証
check-cleanup-resources:
	@echo "Verifying cleanup resources status..."
	@node ./scripts/check/check-cleanup-resources.js $(ProjectName)


# 全リソースの包括的クリーンアップ
cleanup-resources:
	@echo "Starting comprehensive resource cleanup..."
	@node ./scripts/cleanup/cleanup-resources.js $(ProjectName)

# クリーンアップ実行後の検証
cleanup-and-verify: cleanup-resources
	@echo "Cleanup completed. Verifying results..."
	@node ./scripts/check/check-cleanup-resources.js $(ProjectName)

# CloudFormationスタック削除後のリソースクリーンアップ
cleanup-after-destroy: destroy
	@echo "CloudFormation stacks deleted. Cleaning up remaining resources..."
	@node ./scripts/cleanup/cleanup-resources.js $(ProjectName)

# CloudFormationスタック削除後のリソースクリーンアップと検証
cleanup-after-destroy-and-verify: destroy
	@echo "CloudFormation stacks deleted. Cleaning up remaining resources..."
	@node ./scripts/cleanup/cleanup-resources.js $(ProjectName)
	@echo "Cleanup completed. Verifying results..."
	@node ./scripts/check/check-cleanup-resources.js $(ProjectName)

# =============================================================================
# AWS リソース状態確認コマンド
# =============================================================================

# EKSクラスターとCloudFormationスタックのステータス確認
status-eks:
	@echo "===== EKS Cluster Status ====="
	-@aws eks describe-cluster --name $(CLUSTER_NAME) --region $(AwsRegion) --query 'cluster.{Name:name,Status:status,Version:version,Endpoint:endpoint}' --output table 2>/dev/null || echo "Cluster not found"
	@echo ""
	@echo "===== EKS Nodegroups Status ====="
	-@aws eks list-nodegroups --cluster-name $(CLUSTER_NAME) --region $(AwsRegion) --query 'nodegroups[]' --output table 2>/dev/null || echo "No nodegroups found"
	@echo ""
	@echo "===== CloudFormation Stack Status ====="
	-@aws cloudformation describe-stacks --stack-name $(EKS_CLUSTER_STACK) --region $(AwsRegion) --query 'Stacks[0].{StackName:StackName,Status:StackStatus,CreationTime:CreationTime}' --output table 2>/dev/null || echo "Stack not found"
	@echo ""
	@echo "===== Recent Stack Events (Last 5) ====="
	-@aws cloudformation describe-stack-events --stack-name $(EKS_CLUSTER_STACK) --region $(AwsRegion) --max-items 5 --query 'StackEvents[].[Timestamp,LogicalResourceId,ResourceStatus]' --output table 2>/dev/null || echo "No events found"

# 全スタックのステータス確認
status-all:
	@echo "===== All CloudFormation Stacks Status ====="
	@echo "Prerequisites Stack:"
	-@aws cloudformation describe-stacks --stack-name $(PREREQUISITES_STACK) --region $(AwsRegion) --query 'Stacks[0].{Status:StackStatus,Created:CreationTime}' --output table 2>/dev/null || echo "  Not found"
	@echo ""
	@echo "Network Stack:"
	-@aws cloudformation describe-stacks --stack-name $(NETWORK_STACK) --region $(AwsRegion) --query 'Stacks[0].{Status:StackStatus,Created:CreationTime}' --output table 2>/dev/null || echo "  Not found"
	@echo ""
	@echo "ALB Stack:"
	-@aws cloudformation describe-stacks --stack-name $(ALB_STACK) --region $(AwsRegion) --query 'Stacks[0].{Status:StackStatus,Created:CreationTime}' --output table 2>/dev/null || echo "  Not found"
	@echo ""
	@echo "EKS Cluster Stack:"
	-@aws cloudformation describe-stacks --stack-name $(EKS_CLUSTER_STACK) --region $(AwsRegion) --query 'Stacks[0].{Status:StackStatus,Created:CreationTime}' --output table 2>/dev/null || echo "  Not found"
	@echo ""
	@echo "Bastion Stack:"
	-@aws cloudformation describe-stacks --stack-name $(BASTION_STACK) --region $(AwsRegion) --query 'Stacks[0].{Status:StackStatus,Created:CreationTime}' --output table 2>/dev/null || echo "  Not found"

# =============================================================================
# ワークフロー実行コマンド
# =============================================================================

# 定例作業ワークフロー実行

workflow-run-01-03:
	@echo "Starting EKS cluster management workflow..."
	@node ./scripts/workflow/workflow-run-01-03.js

workflow-run-04:
	@echo "Starting EKS cluster management workflow..."
	@node ./scripts/workflow/workflow-run-04.js

workflow-run-05:
	@echo "Starting EKS cluster management workflow..."
	@node ./scripts/workflow/workflow-run-05.js

workflow-run-06:
	@echo "Starting Bastion host management workflow..."
	@node ./scripts/workflow/workflow-run-06.js

workflow-destroy:
	@echo "Starting resource destruction workflow..."
	@node ./scripts/workflow/workflow-destroy.js

# Bastionホスト専用ワークフロー
workflow-bastion:
	@echo "Starting Bastion host management workflow..."
	@./scripts/workflow/workflow-run-bastion.sh

workflow-destroy-bastion:
	@echo "Starting Bastion host destruction workflow..."
	@./scripts/workflow/workflow-destroy-bastion.sh

# EKSクラスター専用ワークフロー
workflow-eks:
	@echo "Starting EKS cluster management workflow..."
	@./scripts/workflow/workflow-run-eks.sh

workflow-destroy-eks:
	@echo "Starting EKS cluster destruction workflow..."
	@./scripts/workflow/workflow-destroy-eks.sh