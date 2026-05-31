# CloudFormation Infrastructure

5つのCloudFormationテンプレートによる段階的EKS環境構築システム。セキュリティベストプラクティスとプロダクション対応のアーキテクチャを実装。

> **⚠️ 重要**: 今回のデプロイではKMS暗号化を無効化しています。学習・検証環境での使用を想定しており、本番環境での使用には適していません。

## 🏗️ テンプレート構成

```
📋 CloudFormation Templates (v2)
├── 01-prerequisites.yaml    # KMS, ECR, S3, IAM (基盤)
├── 02-network.yaml         # VPC, サブネット, セキュリティグループ
├── 03-alb.yaml            # Application Load Balancer
├── 04-eks-platform.yaml # EKS エンタープライズプラットフォーム, ノードグループ
└── 05-bastion.yaml        # 管理用バスティオンホスト
```

## 📊 デプロイメント順序

> **⚠️ 重要**: EKSクラスターを先にデプロイし、その後ALBをデプロイしてください。ALBテンプレート（05-alb.yaml）がEKSのNodeGroupSecurityGroupIdを参照するため、順序を逆にすると循環依存エラーが発生します。

| Stage | スタック名 | テンプレート | 所要時間 | 依存関係 |
|-------|-----------|-------------|---------|---------|
| 1️⃣ | `eks-prerequisites-v2` | 01-prerequisites.yaml | ~3分 | なし |
| 2️⃣ | `eks-network-v2` | 02-network.yaml | ~1分 | Prerequisites |
| 3️⃣ | `eks-platform-v2` | 04-eks.yaml | ~20分 | Prerequisites, Network |
| 4️⃣ | `eks-alb-v2` | 05-alb.yaml | ~4分 | Prerequisites, Network, **EKS** |
| 5️⃣ | `eks-bastion-v2` | 06-bastion.yaml | ~10分 | Prerequisites, Network, EKS |

**総デプロイ時間**: 約38分  
**総削除時間**: 約25分

## 🔧 各テンプレートの詳細

### 1️⃣ Prerequisites (`eks-prerequisites-v2`)

**目的**: 基盤セキュリティリソースの構築

**主要リソース**:
```yaml
- AWS::ECR::Repository      # コンテナリポジトリ (eks-platform-v2-eks-app-v2)  
- AWS::S3::Bucket          # ブートストラップ用バケット (AES256暗号化・バージョニング)
- AWS::S3::BucketPolicy    # セキュア転送強制
- AWS::IAM::Role           # EC2 S3アクセスロール
- AWS::IAM::InstanceProfile # EC2インスタンスプロファイル
- AWS::SSM::Parameter (x4)  # クロススタック共有パラメータ
```

**セキュリティ機能**:
- S3バケット暗号化（AES256）・バージョニング・ライフサイクル
- HTTPS強制ポリシー
- 最小権限IAMロール
- **KMS暗号化は無効化**（学習環境向け）

**出力**: S3バケット、IAMロール、SSMパラメータ

### 2️⃣ Network (`eks-network-v2`)

**目的**: セキュアなVPCネットワークの構築

**主要リソース**:
```yaml
- AWS::EC2::VPC                    # 10.0.0.0/16
- AWS::EC2::Subnet (x4)           # Public×2, Private×2 (Multi-AZ)
- AWS::EC2::InternetGateway       # インターネット接続
- AWS::EC2::RouteTable (x2)       # ルーティング制御
- AWS::EC2::SecurityGroup (x2)    # Bastion, EKS Cluster用
- AWS::SSM::Parameter (x4)        # ネットワーク情報共有
```

**ネットワーク設計**:
```
VPC: 10.0.0.0/16
├── Public Subnets
│   ├── 10.0.1.0/24 (ap-northeast-1a) 
│   └── 10.0.2.0/24 (ap-northeast-1c)
└── Private Subnets  
    ├── 10.0.10.0/24 (ap-northeast-1a) ← EKS Worker Nodes
    └── 10.0.11.0/24 (ap-northeast-1c)
```

**セキュリティ機能**:
- Bastion SG: SSM Session Manager専用（ingress rule無し）
- EKS Cluster SG: 最小限の通信許可
- Kubernetes cluster tags付与

**出力**: VPC, サブネット, セキュリティグループID

### 3️⃣ ALB (`eks-alb-v2`)

**目的**: アプリケーションロードバランサーの構築

**主要リソース**:
```yaml
- AWS::ElasticLoadBalancingV2::LoadBalancer    # インターネット向けALB
- AWS::ElasticLoadBalancingV2::TargetGroup     # EKS NodePort (30080)
- AWS::ElasticLoadBalancingV2::Listener        # HTTP (80) リスナー
- AWS::EC2::SecurityGroup                      # ALB専用SG
```

**セキュリティ機能**:
- ALB SG ingress: HTTP (80) のみ
- ALB SG egress: NodePort (30080) to VPC CIDR, HTTPS (443) outbound
- ヘルスチェック設定: `/healthz` エンドポイント

**出力**: ALB, ターゲットグループ, セキュリティグループ

### 4️⃣ EKS Enterprise Platform (`eks-platform-v2`)

**目的**: セキュアなEKSエンタープライズプラットフォームクラスターとワーカーノードの構築

**主要リソース**:
```yaml
- AWS::IAM::Role (x2)              # クラスター, ノード用ロール
- AWS::EKS::Cluster               # Kubernetes 1.31 クラスター
- AWS::EKS::Nodegroup             # マネージドノードグループ
- AWS::EC2::LaunchTemplate        # EBS暗号化対応
- AWS::SSM::Parameter (x2)        # クラスター情報共有
```

**クラスター設定**:
```yaml
Kubernetes Version: 1.31
Node Instance Type: t3.small
Scaling: Min=1, Desired=2, Max=3
Capacity Type: ON_DEMAND
```

**セキュリティ機能**:
- EKS APIエンドポイント: VPC CIDR (10.0.0.0/16) のみアクセス許可
- Secrets暗号化: AWS managed key使用
- EBS暗号化: AWS managed key使用  
- クラスターログ: 全タイプ（api, audit, authenticator, controllerManager, scheduler）
- IAMロール: 最小権限設計
- **KMS暗号化は無効化**（学習環境向け）

**出力**: クラスター名, エンドポイント, セキュリティグループ, ノードグループ

### 5️⃣ Bastion Host (`eks-bastion-v2`)

**目的**: セキュアな管理アクセス基盤の構築

**主要リソース**:
```yaml
- AWS::IAM::Role                   # EKS管理権限付きロール
- AWS::IAM::InstanceProfile       # インスタンスプロファイル
- AWS::EC2::LaunchTemplate        # EBS暗号化対応
- AWS::EC2::Instance              # Ubuntu 24.04 LTS (t3.micro)
- AWS::SSM::Parameter             # インスタンス情報共有
```

**セキュリティ機能**:
- アクセス方法: SSM Session Managerのみ（SSH無効）
- EBS暗号化: AWS managed key使用
- IAM権限: EKS管理 + S3アクセス最小権限
- **KMS暗号化は無効化**（学習環境向け）

**インストール済みツール** (User Data):
```bash
- AWS CLI v2
- kubectl  
- Docker
- ArgoCD CLI
- Helm
- jq, curl, git
- 各種エイリアス設定
```

**出力**: インスタンスID, 接続コマンド, IAMロール

## 🚀 デプロイメント手順

### 前提条件

```bash
# 必要なAWS権限
- CloudFormation: 完全アクセス
- EKS: 完全アクセス  
- EC2: 完全アクセス
- IAM: ロール・ポリシー作成権限
- KMS: キー作成・管理権限
- S3: バケット作成・管理権限
- ALB: 作成・管理権限

# AWS CLI設定確認
aws sts get-caller-identity
aws configure list
```

### 設定カスタマイズ

```bash
# config.yaml編集
vim config.yaml

# 重要設定項目:
basic:
  AwsRegion: ap-northeast-1        # デプロイ先リージョン
  ProjectName: eks-platform         # リソース命名プレフィックス
  cluster_name: eks-platform         # EKSクラスター名
  
parameters:
  network:
    vpc_cidr: 10.0.0.0/16          # VPC CIDR範囲
  eks:
    kubernetes_version: "1.31"      # Kubernetes バージョン
    node_instance_type: t3.small    # ワーカーノードタイプ
```

### 段階的デプロイ（推奨）

```bash
# 1. Prerequisites デプロイ
aws cloudformation create-stack \
  --stack-name eks-prerequisites-v2 \
  --template-body file://templates/01-prerequisites.yaml \
  --parameters ParameterKey=Environment,ParameterValue=learning \
               ParameterKey=Project,ParameterValue=eks-platform-v2 \
               ParameterKey=Owner,ParameterValue=admin \
  --capabilities CAPABILITY_NAMED_IAM

# 作成完了まで待機
aws cloudformation wait stack-create-complete --stack-name eks-prerequisites-v2

# 2. Network デプロイ  
aws cloudformation create-stack \
  --stack-name eks-network-v2 \
  --template-body file://templates/02-network.yaml \
  --parameters ParameterKey=PrerequisitesStackName,ParameterValue=eks-prerequisites-v2 \
               ParameterKey=Environment,ParameterValue=learning \
               ParameterKey=Project,ParameterValue=eks-platform-v2

aws cloudformation wait stack-create-complete --stack-name eks-network-v2

# 3. ALB デプロイ
aws cloudformation create-stack \
  --stack-name eks-alb-v2 \
  --template-body file://templates/03-alb.yaml \
  --parameters ParameterKey=NetworkStackName,ParameterValue=eks-network-v2 \
               ParameterKey=Environment,ParameterValue=learning \
               ParameterKey=Project,ParameterValue=eks-platform-v2

aws cloudformation wait stack-create-complete --stack-name eks-alb-v2

# 4. EKS Cluster デプロイ
aws cloudformation create-stack \
  --stack-name eks-platform-v2 \
  --template-body file://templates/04-eks.yaml \
  --parameters ParameterKey=PrerequisitesStackName,ParameterValue=eks-prerequisites-v2 \
               ParameterKey=NetworkStackName,ParameterValue=eks-network-v2 \
               ParameterKey=ClusterName,ParameterValue=eks-platform-v2 \
               ParameterKey=Project,ParameterValue=eks-platform-v2 \
  --capabilities CAPABILITY_NAMED_IAM

aws cloudformation wait stack-create-complete --stack-name eks-platform-v2

# 5. Bastion Host デプロイ
aws cloudformation create-stack \
  --stack-name eks-bastion-v2 \
  --template-body file://templates/05-bastion.yaml \
  --parameters ParameterKey=PrerequisitesStackName,ParameterValue=eks-prerequisites-v2 \
               ParameterKey=NetworkStackName,ParameterValue=eks-network-v2 \
               ParameterKey=EKSClusterStackName,ParameterValue=eks-platform-v2 \
               ParameterKey=Project,ParameterValue=eks-platform-v2 \
  --capabilities CAPABILITY_NAMED_IAM

aws cloudformation wait stack-create-complete --stack-name eks-bastion-v2
```

### Makefile使用（簡単デプロイ）

```bash
# 全テンプレート構文検証
make validate-all

# 段階的デプロイ
make deploy-prerequisites    # ~3分
make deploy-network         # ~1分  
make deploy-alb            # ~4分
make deploy-eks-platform    # ~20分
make deploy-bastion        # ~10分

# 一括デプロイ
make deploy-all            # ~38分

# 状態確認
make status               # 全スタック状況確認
make describe-prerequisites  # 特定スタック詳細
```

### ワークフロー使用（推奨）

```bash
# 01-04スタック自動デプロイ（冪等性保証）
make workflow-run-01-04     # ~28分（S3アップロード込み）

# 05スタック（Bastion）デプロイ
make workflow-run-05        # ~10分

# 全リソース削除
make workflow-destroy       # ~25分

# 全体ステータス確認
make check-all             # 全スタック状況確認
```

**ワークフローの特徴：**
- **冪等性**: 複数回実行しても同じ結果
- **自動S3アップロード**: 前提条件デプロイ後に必要ファイルを自動アップロード
- **エラーハンドリング**: 各段階での詳細なエラーチェック
- **進捗表示**: 時間推定と進捗状況の可視化
- **通知機能**: Discord通知（設定済みの場合）

## 📋 運用コマンド

### 状態確認

```bash
# 全スタック状況一覧
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `eks-`) == `true`].[StackName,StackStatus]' \
  --output table

# 特定スタック詳細  
aws cloudformation describe-stacks --stack-name eks-platform-v2

# リソース一覧
aws cloudformation describe-stack-resources --stack-name eks-platform-v2

# スタックイベント
aws cloudformation describe-stack-events --stack-name eks-platform-v2 --max-items 10
```

### EKS管理

```bash
# kubectl設定
aws eks update-kubeconfig --region ap-northeast-1 --name eks-platform-v2

# クラスター情報確認
kubectl cluster-info
kubectl get nodes -o wide
kubectl get pods --all-namespaces

# ノード詳細確認
kubectl describe nodes
kubectl top nodes
```

### Bastion Host接続

```bash
# インスタンスID取得
BASTION_ID=$(aws cloudformation describe-stacks \
  --stack-name eks-bastion-v2 \
  --query 'Stacks[0].Outputs[?OutputKey==`BastionInstanceId`].OutputValue' \
  --output text)

# Session Manager接続  
aws ssm start-session --target $BASTION_ID --region ap-northeast-1

# 接続後のBastion内作業例
kubectl get nodes
docker ps
helm list
```

### セキュリティ監査

```bash
# KMS キー確認
aws kms describe-key --key-id alias/eks-platform-v2-eks-key

# セキュリティグループ確認
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=eks-platform-v2-*" \
  --query 'SecurityGroups[*].[GroupName,GroupId,Description]' \
  --output table

# IAMロール権限確認
aws iam list-attached-role-policies --role-name eks-platform-v2-cluster-role
aws iam get-role-policy --role-name eks-platform-v2-cluster-role --policy-name KMSAccessPolicy

# EKS エンドポイントアクセス確認
aws eks describe-cluster --name eks-platform-v2 \
  --query 'cluster.resourcesVpcConfig.{EndpointPublicAccess:endpointPublicAccess,EndpointPrivateAccess:endpointPrivateAccess,PublicAccessCidrs:publicAccessCidrs}'
```

## 🧹 削除手順

### 段階的削除（推奨）

```bash
# 逆順で削除
aws cloudformation delete-stack --stack-name eks-bastion-v2
aws cloudformation wait stack-delete-complete --stack-name eks-bastion-v2

aws cloudformation delete-stack --stack-name eks-platform-v2  
aws cloudformation wait stack-delete-complete --stack-name eks-platform-v2

aws cloudformation delete-stack --stack-name eks-alb-v2
aws cloudformation wait stack-delete-complete --stack-name eks-alb-v2

aws cloudformation delete-stack --stack-name eks-network-v2
aws cloudformation wait stack-delete-complete --stack-name eks-network-v2

aws cloudformation delete-stack --stack-name eks-prerequisites-v2
aws cloudformation wait stack-delete-complete --stack-name eks-prerequisites-v2
```

### Makefile使用

```bash
# 段階的削除
make cleanup-bastion
make cleanup-eks-platform  
make cleanup-alb
make cleanup-network
make cleanup-prerequisites

# 一括削除（警告: 全リソース削除）
make cleanup-all
```

## 🔒 セキュリティ機能詳細

### 暗号化

| リソース | 暗号化方式 | キー管理 |
|---------|-----------|----------|
| EBS (EKS Worker) | AES256 | AWS managed |
| EBS (Bastion) | AES256 | AWS managed |
| S3 Bucket | AES256 | AWS managed |
| EKS Secrets | AES256 | AWS managed |  
| ECR | AES256 | AWS managed |

> **⚠️ 注意**: 学習環境向けにKMS暗号化を無効化しています。本番環境ではKMS暗号化の使用を強く推奨します。

### ネットワークアクセス制御

| コンポーネント | アクセス制御 | 説明 |
|---------------|-------------|------|
| EKS API Server | VPC CIDR のみ | 10.0.0.0/16 からのみアクセス可能 |
| Bastion Host | SSM のみ | SSH ポート閉鎖、Session Manager専用 |
| ALB | インターネット | HTTP 80番ポートのみ公開 |
| Worker Nodes | プライベート | パブリックIP無し、プライベートサブネット配置 |

### IAM権限設計

```yaml
EKS Cluster Role:
  - AmazonEKSClusterPolicy

EKS Node Role:  
  - AmazonEKSWorkerNodePolicy
  - AmazonEKS_CNI_Policy
  - AmazonEC2ContainerRegistryReadOnly
  - S3バケットアクセス（最小権限）

Bastion Role:
  - AmazonSSMManagedInstanceCore
  - EKS管理権限（読み取りのみ）
  - S3バケットアクセス（最小権限）
```

## 📊 監視とログ

### CloudWatch ログ

```bash
# EKS クラスターログ確認
aws logs describe-log-groups --log-group-name-prefix "/aws/eks/eks-platform-v2"

# 特定ログストリーム確認
aws logs filter-log-events \
  --log-group-name "/aws/eks/eks-platform-v2/cluster" \
  --start-time $(date -d '1 hour ago' +%s)000

# CloudFormation ログ
aws logs filter-log-events \
  --log-group-name "/aws/cloudformation" \
  --filter-pattern "eks-platform-v2"
```

### メトリクス監視

```bash
# EKS クラスターメトリクス
aws cloudwatch get-metric-statistics \
  --namespace AWS/EKS \
  --metric-name cluster_failed_request_count \
  --dimensions Name=ClusterName,Value=eks-platform-v2 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# EC2 インスタンスメトリクス（Bastion）
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=$BASTION_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. EKS クラスター作成失敗

```bash
# スタックイベント確認
aws cloudformation describe-stack-events \
  --stack-name eks-platform-v2 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# サービスロールの権限確認
aws iam simulate-principal-policy \
  --policy-source-arn $(aws iam get-role --role-name eks-platform-v2-cluster-role --query 'Role.Arn' --output text) \
  --action-names eks:CreateCluster \
  --resource-arns "*"
```

#### 2. ノードグループ参加失敗

```bash
# ノードグループ詳細確認
aws eks describe-nodegroup \
  --cluster-name eks-platform-v2 \
  --nodegroup-name eks-platform-v2-node-group

# ワーカーノードログ確認（Bastion経由）
kubectl get nodes
kubectl describe node <node-name>
```

#### 3. kubectl アクセスエラー

```bash
# kubeconfig 再設定
aws eks update-kubeconfig --region ap-northeast-1 --name eks-platform-v2 --alias eks-platform-v2

# 認証確認
kubectl auth can-i get nodes
kubectl config current-context

# クラスターエンドポイント疎通確認
kubectl cluster-info
```

#### 4. Bastion 接続問題

```bash
# SSM エージェント状態確認
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$BASTION_ID"

# Session Manager 前提条件確認
aws ssm get-connection-status --target $BASTION_ID
```

### 緊急対応手順

```bash
# 1. 問題の特定
make status                              # 全スタック状況確認
aws cloudformation describe-stack-events --stack-name <問題のスタック名>

# 2. ログ収集
aws logs filter-log-events --log-group-name "/aws/eks/eks-platform-v2/cluster" --start-time $(date -d '2 hours ago' +%s)000

# 3. リソース手動確認
aws eks describe-cluster --name eks-platform-v2
aws ec2 describe-instances --filters "Name=tag:Name,Values=eks-platform-v2-*"

# 4. 部分的な修復（Update Stack）
aws cloudformation update-stack \
  --stack-name eks-platform-v2 \
  --template-body file://templates/04-eks.yaml \
  --parameters file://parameters/eks-platform-params.json \
  --capabilities CAPABILITY_NAMED_IAM

# 5. 完全再作成（最終手段）
make cleanup-<problem-stack>
make deploy-<problem-stack>
```

## 📝 設定リファレンス

### config.yaml 設定項目

```yaml
basic:
  AwsRegion: ap-northeast-1          # AWS リージョン
  Environment: learning               # 環境名（development/staging/production/learning）
  ProjectName: eks-platform           # プロジェクト名（リソース命名プレフィックス）
  cluster_name: eks-platform           # EKSクラスター名
  owner: admin                        # リソースオーナー

time_estimation:                      # デプロイ時間目安（分）
  prerequisites: 3
  network: 1
  alb: 4
  cluster: 20
  bastion: 10

stacks:                              # CloudFormationスタック名
  prerequisites: eks-prerequisites-v2
  network: eks-network-v2
  alb: eks-alb-v2
  cluster: eks-platform-v2
  bastion: eks-bastion-v2

parameters:
  network:
    vpc_cidr: 10.0.0.0/16            # VPC CIDR範囲
    public_subnet_1_cidr: 10.0.1.0/24
    public_subnet_2_cidr: 10.0.2.0/24
    private_subnet_1_cidr: 10.0.10.0/24
    private_subnet_2_cidr: 10.0.11.0/24
    enable_nat_gateway: false         # NAT Gateway有効化（コスト考慮で無効）

  s3:
    bucket_prefix: eks-bootstrap      # S3バケット名プレフィックス
    enable_versioning: true           # バージョニング有効化
    enable_encryption: true           # 暗号化有効化

  security:
    enable_kms_encryption: false      # KMS暗号化無効化（学習環境向け）

  ecr:
    repository_name: eks-app-v2       # ECRリポジトリ名

  eks:
    kubernetes_version: "1.31"        # Kubernetesバージョン
    node_instance_type: t3.small      # ワーカーノードインスタンスタイプ
    node_group_min_size: 1            # ノードグループ最小サイズ
    node_group_desired_size: 2        # ノードグループ希望サイズ
    node_group_max_size: 3            # ノードグループ最大サイズ

  bastion:
    instance_type: t3.micro           # Bastionインスタンスタイプ
```

## 📈 コスト最適化

### 推定月額コスト（ap-northeast-1）

| リソース | 数量 | 月額（USD） | 年額（USD） |
|---------|------|------------|------------|
| EKS Cluster | 1 | $72.00 | $864.00 |
| EC2 (t3.small × 2) | 2 | $30.00 | $360.00 |
| EC2 (t3.micro) | 1 | $7.50 | $90.00 |
| ALB | 1 | $22.00 | $264.00 |
| EBS (gp3 20GB × 3) | 3 | $6.00 | $72.00 |
| S3 (最小使用) | - | $1.00 | $12.00 |
| **合計** | | **$138.50** | **$1,662.00** |

### コスト削減策

```bash
# 開発時間外の一時停止
make cleanup-bastion          # Bastion削除 (-$7.50/月)
make cleanup-eks-platform      # EKS削除 (-$102.00/月)
# ※ Network, ALB, Prerequisites は維持

# インスタンスタイプダウン
# config.yaml でノードタイプを t3.small → t3.micro に変更

# 検証終了後の完全削除
make cleanup-all              # 全リソース削除
```

## 📚 参考資料

- [AWS EKS ユーザーガイド](https://docs.aws.amazon.com/eks/latest/userguide/)
- [AWS CloudFormation ユーザーガイド](https://docs.aws.amazon.com/cloudformation/)
- [Kubernetes 公式ドキュメント](https://kubernetes.io/docs/)
- [AWS セキュリティベストプラクティス](https://docs.aws.amazon.com/security/)
- [EKS セキュリティベストプラクティス](https://aws.github.io/aws-eks-best-practices/)

## 📄 ライセンス

本プロジェクトは学習・検証目的で作成されています。本番環境での使用前にセキュリティ要件の再評価を行ってください。

> **🔒 セキュリティ注意事項**: 
> - 今回のデプロイではKMS暗号化を無効化しています
> - 学習・検証環境での使用を想定しています
> - 本番環境での使用には適していません
> - 本番環境では必ずKMS暗号化を有効化してください

```
cd /home/wsl/local_ubuntu/environment-kit/platform/ec2-ubuntu/eks/infrastructure/cloudformation

make workflow-destroy
make check-all

make workflow-run-01-04
```

## 🔒 セキュリティ仕様・強化事項

### 🛡️ エンタープライズ級セキュリティ強化仕様

このEKSインフラストラクチャは**ゼロトラスト**・**多層防御**の原則に基づいて設計されています。

#### 🔐 **ネットワークセキュリティ - プライベートファースト**

```yaml
セキュリティ方針:
  EKSクラスター配置: プライベートサブネットのみ（セキュア＋実用性両立）
  EKS APIエンドポイント: 学習環境では両方有効、本番環境ではプライベートのみ
  NAT Gateway: 有効（アウトバウンド通信・パッケージ更新・ECRアクセス）
  Worker Nodes: プライベート環境（パブリックIP無し・実用的なアウトバウンド許可）
  ALB: パブリックサブネットで外部からのWebアクセス受付
```

**実用的なネットワーク分離**:
```
🌐 Internet Gateway
    │
    ▼ (HTTP/HTTPS Inbound + NAT Outbound)
┌─────────────────────────────────────┐
│ Public Subnets (10.0.1.0/24, 10.0.2.0/24) │
│ ├── NAT Gateway (Internet access)        │
│ └── ALB (Public HTTP/HTTPS access)       │  
└─────────────────────────────────────┘
    │ ↕ (ALB → EKS apps communication)
    ▼
┌─────────────────────────────────────┐
│ Private Subnets (10.0.10.0/24, 10.0.11.0/24) │  
│ ├── EKS Control Plane (Private API)         │
│ ├── EKS Worker Nodes (NAT via internet)     │
│ └── Bastion Host (SSM access only)          │
└─────────────────────────────────────┘
```

#### 🚫 **セキュリティグループ - 最小権限の原則**

**1. EKS Cluster Security Group**
```yaml
Ingress Rules: (最小限の必要通信のみ)
  - Port 443: Bastion → EKS API (kubectl管理用)
  - Self-reference: Cluster内部通信のみ
  
Egress Rules: (制御されたアウトバウンド)
  - Port 10250: Control Plane → Worker Nodes (kubelet)
  - Port 443: Control Plane → Worker Nodes (secure communication)
```

**2. Worker Node Security Group**  
```yaml
Ingress Rules: (実用的なWebアプリケーション対応)
  - Port 30000-32767: ALB → NodePort services (K8s標準範囲)
  - Port 80, 8080: ALB → Web applications (直接アクセス対応)
  - Port 10250: EKS Control Plane → kubelet (管理通信)
  - Port 443: EKS Control Plane → secure communication
  - Self-reference: Node間通信 (CNI, pod-to-pod)
  
Egress Rules: (実用的なアウトバウンド)
  - Port 443: EKS API Server (必要な管理通信)  
  - All traffic: 0.0.0.0/0 (ECRプル、パッケージ更新、外部API等）
```

**3. Bastion Security Group**
```yaml
Ingress Rules: (ゼロインバウンド)
  - No inbound rules (SSM Session Manager経由のみ)
  
Egress Rules: (管理操作限定)  
  - Port 443: EKS Cluster (kubectl管理)
  - Port 443: 0.0.0.0/0 (パッケージ更新・ツール取得)
```

**4. ALB Security Group**
```yaml  
Ingress Rules: (Web Traffic のみ)
  - Port 80: 0.0.0.0/0 (HTTP - リダイレクト用)
  - Port 443: 0.0.0.0/0 (HTTPS - 本番トラフィック)
  
Egress Rules: (NodePortのみ)
  - Port 30000-32767: VPC CIDR (EKS NodePort range)
```

#### 🔒 **アクセス制御 - ゼロトラスト実装**

**1. EKS API Server アクセス制御**
```yaml
Endpoint Configuration:
  Public Access: 学習環境では有効 (開発時の利便性のため)
  Private Access: 有効 (VPC内からのアクセス可能)
  Authorized Networks: 学習環境では 0.0.0.0/0、本番環境では企業IP範囲のみ
  
Access Methods:
  kubectl: 学習環境では直接アクセス可能、本番環境ではBastion Host経由のみ
  Direct API: 学習環境では許可、本番環境では禁止
```

**2. IAM ベースアクセス制御**  
```yaml
EKS Cluster Service Role:
  Managed Policies: AmazonEKSClusterPolicy (最小権限)
  Custom Policies: なし (AWS管理ポリシーのみ使用)
  
Worker Node Instance Role:
  Managed Policies: 
    - AmazonEKSWorkerNodePolicy
    - AmazonEKS_CNI_Policy  
    - AmazonEC2ContainerRegistryReadOnly
    - AmazonSSMManagedInstanceCore (セキュア管理)
```

#### 🏰 **多層防御アーキテクチャ**

**Layer 1: Network Level**
- VPC分離 (Private subnet enforcement)
- NAT Gateway (Controlled outbound)
- Security Group (Micro-segmentation)

**Layer 2: Platform Level**  
- EKS Private API (No internet exposure)
- SSM Session Manager (No SSH/RDP)  
- ECR/S3 VPC Endpoints (Optional - traffic stays in AWS backbone)

**Layer 3: Application Level**
- ALB WAF Ready (Optional integration point)
- NodePort range restriction  
- Container image scanning (ECR)

**Layer 4: Monitoring & Compliance**
- CloudTrail Ready (API call logging)
- VPC Flow Logs Ready (Network traffic analysis)  
- AWS Config Ready (Compliance monitoring)

#### ⚠️ **セキュリティ制約事項**

**学習環境向け緩和設定**:
```yaml
Disabled for Learning:
  KMS Encryption: 無効 (コスト・複雑性削減)  
  VPC Endpoints: 未実装 (基本構成重視)
  WAF: 未実装 (ALBに後付け可能)
  
Production で必須:
  KMS: 有効化必須 (データ暗号化)
  VPC Endpoints: S3, ECR, EKS用 (トラフィック最適化)  
  WAF: ALB前段に配置 (アプリケーション保護)
  Secrets Manager: RDS/アプリシークレット管理
```

#### 🔧 **セキュリティ検証コマンド**

```bash
# EKS API エンドポイント確認 (Privateのみであることを確認)
aws eks describe-cluster --name eks-platform-v2 --query 'cluster.endpoint'

# セキュリティグループ制限確認
aws ec2 describe-security-groups --group-names eks-platform-v2-cluster-sg

# Worker Node配置確認 (Private subnetのみであることを確認)  
aws eks describe-nodegroup --cluster-name eks-platform-v2 --nodegroup-name eks-platform-v2-worker-nodes

# Bastion接続確認 (SSM経由)
aws ssm start-session --target <bastion-instance-id>
```

#### 📋 **セキュリティ運用チェックリスト**

**デプロイ前**:
- [ ] EKS cluster が private subnet のみに配置されている
- [ ] EKS API endpoint が private のみに設定されている  
- [ ] Security Group rules が最小権限になっている
- [ ] NAT Gateway が有効化されている

**デプロイ後**:
- [ ] kubectl が bastion 経由でのみアクセス可能
- [ ] Worker nodes にパブリック IP が割り当てられていない
- [ ] ALB が正しく NodePort にルーティングしている
- [ ] SSM Session Manager で bastion にアクセス可能

**本番運用時追加**:
- [ ] KMS encryption 有効化
- [ ] VPC Endpoints 設定 (S3, ECR, EKS)
- [ ] WAF ルール設定  
- [ ] CloudTrail/Config 有効化
- [ ]定期的なセキュリティ監査実施

---

> **🚨 重要**: この設定により EKS クラスターは**完全にプライベート環境**で動作し、インターネットからの直接アクセスは不可能です。すべての管理作業は SSM Session Manager 経由の Bastion Host から実行してください。
