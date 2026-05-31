# EKS Learning Environment

本プロジェクトは、AWS EKSクラスターを使用した学習環境を構築・管理するためのリポジトリです。5つのCloudFormationテンプレートによる段階的デプロイメントとセキュリティベストプラクティスを実装した統合環境を提供します。

## 📁 プロジェクト構成

```
eks/
├── 📋 README.md                                # このファイル
├── 🛠️ Makefile                                 # 統合管理コマンド
├── 📚 docs/                                    # ドキュメント
│   ├── architecture.md                         # アーキテクチャ概要
│   ├── deployment-guide.md                     # デプロイガイド
│   └── troubleshooting.md                      # トラブルシューティング
├── 🏗️ infrastructure/                          # インフラストラクチャ定義
│   └── cloudformation/                         # AWS CloudFormationテンプレート
│       ├── config.yaml                         # 統合設定ファイル
│       └── templates/                          # CloudFormationテンプレート
│           ├── 01-prerequisites.yaml           # 事前要件: KMS, ECR, S3, IAM
│           ├── 02-network.yaml                 # ネットワーク: VPC, サブネット, セキュリティグループ
│           ├── 03-alb.yaml                     # アプリケーションロードバランサー
│           ├── 04-eks-platform.yaml             # EKSクラスターとノードグループ
│           └── 05-bastion.yaml                 # バスティオンホスト
├── 🚀 applications/                            # アプリケーション
│   ├── backend/                                # バックエンドAPI (Node.js)
│   └── frontend/                               # フロントエンドアプリ
├── 🔧 scripts/                                # 運用スクリプト
│   ├── setup/                                  # セットアップスクリプト
│   ├── deployment/                             # デプロイスクリプト
│   ├── management/                             # 管理スクリプト
│   └── common/                                 # 共通ユーティリティ
└── 🧪 tests/                                  # テスト
```

## 🏗️ CloudFormation アーキテクチャ

### 📋 デプロイ順序（推定時間）

| Stage | Template | 説明 | 時間 |
|-------|----------|------|------|
| 1️⃣ | `01-prerequisites.yaml` | 事前要件リソース | ~3分 |
| 2️⃣ | `02-network.yaml` | VPCとネットワーク | ~1分 |
| 3️⃣ | `03-alb.yaml` | アプリケーションロードバランサー | ~4分 |
| 4️⃣ | `04-eks-platform.yaml` | EKSクラスターとノードグループ | ~20分 |
| 5️⃣ | `05-bastion.yaml` | バスティオンホスト | ~10分 |

### 🔧 各テンプレートの詳細

#### 1️⃣ Prerequisites (事前要件)
```yaml
スタック名: eks-prerequisites-v2
リソース:
  - KMS暗号化キー (自動ローテーション有効)
  - ECR プライベートリポジトリ (eks-platform-v2-eks-app-v2)
  - S3バケット (暗号化、バージョニング有効)
  - IAM ロール (EC2→S3アクセス用)
  - SSMパラメータ (クロススタック共有用)
```

#### 2️⃣ Network (ネットワーク)
```yaml
スタック名: eks-network-v2
リソース:
  - VPC (10.0.0.0/16)
  - パブリックサブネット × 2 (10.0.1.0/24, 10.0.2.0/24)
  - プライベートサブネット × 2 (10.0.10.0/24, 10.0.11.0/24)
  - インターネットゲートウェイ
  - ルートテーブル
  - セキュリティグループ (Bastion, EKS Cluster用)
  - SSMセッションマネージャー専用設定
```

#### 3️⃣ Application Load Balancer
```yaml
スタック名: eks-alb-v2
リソース:
  - ALB (パブリックサブネット配置)
  - ターゲットグループ (EKS NodePort 30080)
  - セキュリティグループ (HTTP 80番ポート)
  - HTTPリスナー (ヘルスチェック設定済み)
```

#### 4️⃣ EKS Cluster
```yaml
スタック名: eks-platform-v2
リソース:
  - EKS クラスター (Kubernetes 1.31)
  - IAM サービスロール (KMSアクセス権限付き)
  - ワーカーノードグループ (t3.small, 1-3台スケーリング)
  - Launch テンプレート (EBS暗号化)
  - クラスターログ (CloudWatch)
  - Secrets暗号化 (KMS)
  - エンドポイントアクセス制限 (VPC CIDRのみ)
```

#### 5️⃣ Bastion Host
```yaml
スタック名: eks-bastion-v2
リソース:
  - EC2インスタンス (Ubuntu 24.04 LTS, t3.micro)
  - IAM ロール (EKS管理権限)
  - EBS暗号化ボリューム
  - SSM Session Manager設定
  - 自動ツールインストール用 User Data
```

## 🚀 クイックスタート

### 1. 前提条件
```bash
# 必要な権限
- CloudFormation: Full Access
- EKS: Full Access
- EC2: Full Access
- IAM: Role/Policy作成権限
- KMS: Key作成・管理権限
- S3: Bucket作成・管理権限

# AWS CLI設定
aws configure
aws sts get-caller-identity  # 認証確認
```

### 2. 設定カスタマイズ
```bash
# config.yamlを編集して環境設定をカスタマイズ
vim infrastructure/cloudformation/config.yaml

# 主要設定項目:
# - AwsRegion: デプロイ先リージョン
# - ProjectName: リソース命名プレフィックス
# - vpc_cidr: VPC CIDR範囲
# - node_instance_type: EKSワーカーノードタイプ
```

### 3. インフラストラクチャのデプロイ
```bash
# CloudFormationディレクトリに移動
cd infrastructure/cloudformation

# 段階的デプロイ実行
make deploy-prerequisites  # ~3分
make deploy-network       # ~1分
make deploy-alb          # ~4分
make deploy-eks-platform  # ~20分
make deploy-bastion      # ~10分

# または一括デプロイ
make deploy-all          # ~38分
```

### 4. デプロイ状況確認
```bash
# すべてのスタック状況確認
make status

# 特定スタックの詳細確認
aws cloudformation describe-stacks --stack-name eks-prerequisites-v2
```

### 5. Kubernetesクラスターアクセス設定
```bash
# kubectl設定
aws eks update-kubeconfig --region ap-northeast-1 --name eks-platform-v2

# クラスター接続確認
kubectl cluster-info
kubectl get nodes
```

### 6. バスティオンホストに接続
```bash
# Session Manager経由でアクセス（セキュア）
aws ssm start-session --target <BASTION-INSTANCE-ID> --region ap-northeast-1
```

## 🔒 セキュリティ機能

### 🛡️ 実装済みセキュリティ対策

#### **暗号化**
- **EBS ボリューム**: KMS暗号化 (クラスター・Bastion)
- **S3 バケット**: KMS/AES256暗号化
- **EKS Secrets**: KMS暗号化
- **ECR**: KMS/AES256暗号化

#### **アクセス制御**
- **EKS API**: VPC CIDR制限 (10.0.0.0/16のみ)
- **Bastion**: SSM Session Manager専用（SSH無効）
- **ALB**: 最小限のegress権限
- **IAM**: 最小権限の原則適用

#### **ネットワークセキュリティ**
- **VPC**: プライベート/パブリックサブネット分離
- **Security Groups**: 最小限のトラフィック許可
- **NACLs**: デフォルト設定で追加防御層

#### **ログ・監査**
- **EKS Cluster**: 全ログタイプをCloudWatchに記録
- **CloudFormation**: スタック操作ログ
- **IAM**: アクセスログ記録

### 🔐 セキュリティベストプラクティス準拠

- ✅ **データ暗号化**: 保存時・転送時暗号化
- ✅ **アクセス最小化**: 必要最小限の権限付与  
- ✅ **ネットワーク分離**: セグメント化されたネットワーク
- ✅ **監査ログ**: 包括的なログ記録
- ✅ **定期ローテーション**: KMSキー自動ローテーション

## 📚 主要コマンド

### CloudFormation管理
```bash
# デプロイ
make deploy-all           # 全スタックデプロイ
make deploy-prerequisites # 事前要件のみ
make deploy-network      # ネットワークのみ
make deploy-alb         # ALBのみ
make deploy-eks-platform # EKSクラスターのみ
make deploy-bastion     # Bastionのみ

# 状態確認
make status             # 全スタック状況
make validate          # テンプレート構文検証

# 削除（危険操作）
make cleanup-all       # 全リソース削除
make cleanup-bastion   # Bastionのみ削除
make cleanup-eks       # EKSクラスターのみ削除
```

### Kubernetes管理
```bash
# クラスター接続設定
make kubeconfig

# リソース確認
kubectl get nodes
kubectl get pods --all-namespaces
kubectl top nodes

# 状態監視
kubectl get events --sort-by=.metadata.creationTimestamp
```

### 運用・管理
```bash
# Bastion接続
make connect           # Session Manager接続

# ログ確認
make logs              # CloudFormationログ
kubectl logs <pod-name> # Kubernetesポッドログ

# セキュリティ監査
make security-check    # セキュリティ設定確認
```

## 📊 リソース構成概要

### **AWS リソース**
| リソースタイプ | 数量 | 用途 |
|-------------|------|------|
| VPC | 1 | ネットワーク基盤 |
| Subnets | 4 | パブリック×2, プライベート×2 |
| EKS Cluster | 1 | Kubernetes 1.31 |
| EC2 Instances | 2-3+ | ワーカーノード + Bastion |
| ALB | 1 | ロードバランサー |
| Security Groups | 3 | Bastion, ALB, EKS用 |
| KMS Keys | 1 | 暗号化用 |
| S3 Bucket | 1 | ブートストラップスクリプト用 |
| ECR Repository | 1 | コンテナイメージ用 |
| IAM Roles | 4 | サービス別権限管理 |

### **ネットワーク構成**
```
Internet Gateway
       |
   [ALB (Public)]
       |
┌─────────────────────────────┐
│         VPC                 │
│      10.0.0.0/16           │
│                             │
│  Public Subnets             │
│  ├─ 10.0.1.0/24 (AZ-a)    │
│  └─ 10.0.2.0/24 (AZ-c)    │
│                             │
│  Private Subnets            │
│  ├─ 10.0.10.0/24 (AZ-a)   │ ← EKS Worker Nodes
│  └─ 10.0.11.0/24 (AZ-c)   │
│                             │
│  [Bastion Host]             │
│  [EKS Control Plane]        │
└─────────────────────────────┘
```

## 🚀 デプロイメントワークフロー

### **推奨デプロイ手順**
1. **設定確認**: `config.yaml`の設定値確認
2. **テンプレート検証**: `make validate`
3. **段階的デプロイ**: Prerequisites → Network → ALB → EKS → Bastion
4. **接続確認**: `kubectl cluster-info`
5. **Bastion接続**: `make connect`

### **運用フロー**
```bash
# 日常運用
make status              # ヘルスチェック
kubectl get nodes        # ノード状態確認
make security-check      # セキュリティ監査

# アプリケーションデプロイ
kubectl apply -f manifests/
kubectl get pods

# スケーリング
kubectl scale deployment <app> --replicas=3
```

## 📖 高度な運用

### **監視・ログ**
```bash
# CloudWatch監視
aws logs describe-log-groups
aws cloudwatch get-metric-statistics

# EKSクラスター監視
kubectl top nodes
kubectl describe nodes
```

### **バックアップ・災害復旧**
```bash
# EKS設定バックアップ
kubectl get all --all-namespaces -o yaml > cluster-backup.yaml

# 設定ファイルバックアップ
cp -r infrastructure/cloudformation/ backup/
```

### **セキュリティ監査**
```bash
# IAM権限確認
aws iam list-attached-role-policies --role-name eks-platform-v2-cluster-role

# セキュリティグループ確認
aws ec2 describe-security-groups --group-names eks-platform-v2-*
```

## 🧹 クリーンアップ

### **段階的削除（推奨）**
```bash
make cleanup-bastion     # Bastionホスト削除
make cleanup-eks         # EKSクラスター削除  
make cleanup-alb         # ALB削除
make cleanup-network     # ネットワーク削除
make cleanup-prerequisites # 事前要件削除
```

### **完全削除**
```bash
# 警告: 全リソースが削除されます
make cleanup-all
```

## 📞 トラブルシューティング

### **よくある問題**

#### **EKSデプロイ失敗**
```bash
# スタック状態確認
aws cloudformation describe-stack-events --stack-name eks-platform-v2

# ログ確認
aws logs filter-log-events --log-group-name /aws/eks/eks-platform-v2/cluster
```

#### **kubectl接続エラー**
```bash
# kubeconfig再設定
aws eks update-kubeconfig --region ap-northeast-1 --name eks-platform-v2

# 認証確認
aws sts get-caller-identity
kubectl auth can-i get pods
```

#### **Bastion接続問題**
```bash
# Session Manager接続確認
aws ssm describe-instance-information
aws ssm start-session --target <instance-id>
```

### **サポートリソース**
- **CloudFormationイベント**: スタック操作の詳細ログ
- **EKSログ**: `/aws/eks/eks-platform-v2/cluster`
- **EC2ログ**: `/var/log/user-data.log` (Bastion内)
- **AWS Support**: 本番環境での問題対応

## 📝 ライセンス・注意事項

- 本環境は学習・検証目的で設計されています
- 本番利用前にセキュリティ要件の再評価を実施してください  
- AWS利用料金が発生します（主にEKS、EC2、ALB）
- 不要な場合は確実にリソースを削除してください