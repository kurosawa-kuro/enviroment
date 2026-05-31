# CloudFormation 命名規則ガイド

## 概要

このドキュメントは、CloudFormationテンプレートで使用されている命名規則を定義します。
一貫性のある命名により、リソースの識別、管理、メンテナンスが容易になります。

## 1. テンプレートファイル命名規則

### パターン
```
{番号}-{機能名}.yaml
```

### 実例
```
01-prerequisites.yaml    # 前提条件リソース
02-network.yaml         # ネットワークインフラ  
03-alb.yaml            # Application Load Balancer
04-eks-platform.yaml    # EKSエンタープライズプラットフォーム
05-bastion.yaml        # 踏み台サーバー
```

### 規則
- **連番**: デプロイ順序を示す2桁の番号 (01-05)
- **kebab-case**: 小文字 + ハイフン区切り
- **機能名**: リソースの目的を表す英語名

## 2. スタック名命名規則

### パターン
```
{サービス名}-{コンポーネント名}
```

### 実例
```yaml
PrerequisitesStackName:
  Default: eks-prerequisites

NetworkStackName:
  Default: eks-network

EKSClusterStackName:
  Default: eks-platform
```

### 規則
- **kebab-case**: 小文字 + ハイフン区切り
- **サービス名**: `eks` (固定)
- **コンポーネント名**: 機能を表す英語名

## 3. リソース命名規則

### 3.1 論理ID (CloudFormation内部)

#### パターン
```
{機能}{リソースタイプ}
```

#### 実例
```yaml
ECRRepository               # ECRリポジトリ
BootstrapBucket            # S3バケット
BastionSecurityGroup       # セキュリティグループ
NodeGroupLaunchTemplate    # 起動テンプレート
```

#### 規則
- **PascalCase**: 各単語の先頭を大文字
- **英語**: 機能とリソースタイプを組み合わせ

### 3.2 物理名 (AWS上の実リソース名)

#### パターン
```
${Project}-{機能名}-{バージョン?}
```

#### 実例
```yaml
# ECRリポジトリ
RepositoryName: !Sub '${Project}-${ECRRepositoryName}-${Version}'
# 結果: eks-platform-eks-app-v2

# IAMロール
RoleName: !Sub '${Project}-ec2-s3-access-role-${Version}'
# 結果: eks-platform-ec2-s3-access-role-v2

# セキュリティグループ
GroupName: !Sub '${Project}-bastion-sg'
# 結果: eks-platform-bastion-sg
```

#### 規則
- **kebab-case**: 小文字 + ハイフン区切り
- **プロジェクトプリフィックス**: `${Project}` 変数を使用
- **バージョンサフィックス**: 必要に応じて `${Version}` を追加

## 4. パラメーター命名規則

### 4.1 分類別パターン

#### 依存関係パラメーター
```yaml
PrerequisitesStackName     # 前提条件スタック名
NetworkStackName          # ネットワークスタック名
EKSClusterStackName       # EKSクラスタースタック名
```

#### 設定パラメーター
```yaml
VpcCidrBlock              # VPC CIDRブロック
NodeInstanceType          # ノードインスタンスタイプ
KubernetesVersion         # Kubernetesバージョン
```

#### タグ用パラメーター
```yaml
Environment               # 環境名
Version                  # バージョン
Project                  # プロジェクト名
Owner                    # 所有者
```

### 4.2 規則
- **PascalCase**: 各単語の先頭を大文字
- **記述的**: パラメーターの用途が明確
- **一貫性**: 同じ概念には同じ名前を使用

## 5. アウトプット命名規則

### 5.1 アウトプット名

#### パターン
```yaml
{リソース名}{属性名?}
```

#### 実例
```yaml
VpcId                     # VPC ID
ClusterEndpoint           # クラスターエンドポイント
ApplicationLoadBalancerDNS # ALB DNS名
BastionConnectCommand     # 接続コマンド
```

### 5.2 エクスポート名

#### パターン
```yaml
${AWS::StackName}-{アウトプット名}
```

#### 実例
```yaml
Export:
  Name: !Sub '${AWS::StackName}-VpcId'
  Name: !Sub '${AWS::StackName}-ClusterName'
  Name: !Sub '${AWS::StackName}-ALBDNSName'
```

### 5.3 規則
- **PascalCase**: 各単語の先頭を大文字
- **一意性**: エクスポート名はスタック名プリフィックス付き
- **記述的**: 出力される値の内容が明確

## 6. SSM パラメーター命名規則

### 6.1 パスパターン
```
/eks/${Project}-${Version}/{リソース種別}-{説明}
/eks/${Project}/{リソース種別}-{説明}          # 後方互換用
```

### 6.2 実例
```yaml
# バージョン付きパス
Name: !Sub '/eks/${Project}-${Version}/cluster-name'
Name: !Sub '/eks/${Project}-${Version}/bootstrap-bucket-name'
Name: !Sub '/eks/${Project}-${Version}/bastion-instance-id'

# 後方互換用パス
Name: !Sub '/eks/${Project}/vpc-id'
Name: !Sub '/eks/${Project}/public-subnet-ids'
```

### 6.3 規則
- **階層構造**: サービス → プロジェクト-バージョン → リソース
- **kebab-case**: 小文字 + ハイフン区切り
- **バージョン管理**: 新規リソースは `-${Version}` パスを使用

## 7. タグ命名規則

### 7.1 必須タグ

| タグ名 | 説明 | 例 |
|--------|------|-----|
| `Name` | リソース識別名 | `eks-platform-bastion-sg-v2` |
| `Environment` | 環境名 | `learning`, `development`, `production` |
| `Project` | プロジェクト名 | `eks-platform` |
| `Owner` | 所有者 | `admin` |

### 7.2 追加タグ

| タグ名 | 説明 | 例 |
|--------|------|-----|
| `Purpose` | リソースの目的 | `EKS Bastion Host` |
| `ManagedBy` | 管理方法 | `CloudFormation` |
| `Type` | サブネットタイプ | `Public`, `Private` |

### 7.3 Kubernetes専用タグ
```yaml
kubernetes.io/cluster/${Project}: shared
kubernetes.io/role/elb: '1'
kubernetes.io/role/internal-elb: '1'
```

## 8. セキュリティグループ命名規則

### パターン
```
${Project}-{機能}-sg-${Version?}
```

### 実例
```yaml
GroupName: !Sub '${Project}-bastion-sg'          # eks-platform-bastion-sg
GroupName: !Sub '${Project}-alb-sg-${Version}'   # eks-platform-alb-sg-v2
GroupName: !Sub '${Project}-eks-platform-sg'      # eks-platform-eks-platform-sg
```

### 規則
- **kebab-case**: 小文字 + ハイフン区切り
- **機能別**: セキュリティグループの目的が明確
- **バージョン**: 必要に応じてバージョンサフィックス

## 9. IAM リソース命名規則

### 9.1 ロール名

#### パターン
```
${Project}-{機能}-role-${Version?}
${ClusterName}-{機能}-role
```

#### 実例
```yaml
RoleName: !Sub '${Project}-ec2-s3-access-role-${Version}'  # eks-platform-ec2-s3-access-role-v2
RoleName: !Sub '${ClusterName}-cluster-role'              # eks-platform-cluster-role
RoleName: !Sub '${Project}-bastion-role'                  # eks-platform-bastion-role
```

### 9.2 ポリシー名

#### パターン
```
{機能}AccessPolicy
```

#### 実例
```yaml
PolicyName: S3AccessPolicy
PolicyName: EKSAccessPolicy
```

### 9.3 インスタンスプロファイル名

#### パターン
```
${Project}-{機能}-profile-${Version?}
```

#### 実例
```yaml
InstanceProfileName: !Sub '${Project}-ec2-instance-profile-${Version}'
InstanceProfileName: !Sub '${Project}-bastion-profile'
```

## 10. 変数・パラメーター値規則

### 10.1 デフォルト値

| パラメーター | デフォルト値 | 説明 |
|-------------|-------------|------|
| `Project` | `eks-platform` | プロジェクト名 |
| `Version` | `v2` | バージョン番号 |
| `Environment` | `learning` | 環境名 |
| `Owner` | `admin` | 所有者 |

### 10.2 環境値
```yaml
AllowedValues: [development, staging, production, learning]
```

## 11. 命名規則のチェックリスト

### ✅ 実装時確認事項

- [ ] ファイル名は連番 + kebab-case
- [ ] 論理IDはPascalCase
- [ ] 物理リソース名はkebab-case + プロジェクトプリフィックス
- [ ] パラメーター名はPascalCase
- [ ] SSMパラメーターパスにバージョンを含む
- [ ] 必須タグが設定されている
- [ ] エクスポート名にスタック名プリフィックスがある
- [ ] セキュリティグループ名に機能説明がある
- [ ] IAMリソース名にプロジェクト名がある

### ❌ 避けるべき命名

- アンダースコア (_) の使用
- 大文字のみの名前
- 略語の乱用
- 日本語の使用
- 特殊文字の使用

## 12. 命名例外・特別規則

### 12.1 AWS管理リソース
AWS管理のリソース（デフォルトVPC、AMI IDなど）は元の命名に従う

### 12.2 Kubernetesリソース
Kubernetesクラスター内のリソースは、Kubernetes命名規則に従う

### 12.3 サードパーティツール
Helm Chart、ArgoCD等のサードパーティツールは、各ツールの推奨命名規則に従う

---

この命名規則に従うことで、EKSインフラストラクチャ全体の一貫性と保守性が向上し、
運用時のリソース識別とトラブルシューティングが容易になります。