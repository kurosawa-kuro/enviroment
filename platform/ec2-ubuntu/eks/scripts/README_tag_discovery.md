# タグベースEC2インスタンス検索機能

この機能により、EC2インスタンスをタグベースで動的に検索し、ハードコードされた設定に依存せずにインスタンスに接続できるようになります。

## 概要

従来のハードコードされたインスタンスIDの代わりに、AWSタグを使用してEC2インスタンスを動的に検索します。これにより、以下のメリットがあります：

- インスタンスIDが変更されても自動的に検出
- 複数の環境（dev, stg, com）での柔軟な運用
- タグベースの管理による可視性の向上

## 対応タグ

以下のタグパターンでインスタンスを検索します：

### 環境別タグパターン
- **dev環境**: `Name=*dev*bastion*`
- **stg環境**: `Name=*stg*bastion*`
- **com環境**: `Name=*com*bastion*`

### 追加タグ
CloudFormationテンプレートで以下のタグが設定されます：
- `Environment`: クラスター名
- `Type`: `bastion`
- `Purpose`: `eks-management`

## 使用方法

### 1. 基本的な使用方法

```bash
# デフォルト（dev環境、defaultプロファイル、タグベース検索）
./start_session_bastion.sh

# 特定の環境を指定
./start_session_bastion.sh --env stg

# 特定のAWSプロファイルを指定
./start_session_bastion.sh --profile my-profile

# ハードコードされた設定を使用（フォールバック）
./start_session_bastion.sh --no-tags
```

### 2. コマンドラインオプション

| オプション | 説明 | デフォルト値 |
|-----------|------|-------------|
| `--env ENV` | 環境名 (dev, stg, com) | dev |
| `--profile PROFILE` | AWSプロファイル名 | default |
| `--no-tags` | タグベース検索を無効化 | false |
| `--help` | ヘルプメッセージを表示 | - |

### 3. テスト機能

タグベース検索機能をテストするには：

```bash
# すべてのテストを実行
./test_tag_discovery.sh

# 特定の環境でテスト
./test_tag_discovery.sh --env stg

# タグベース検索のみテスト
./test_tag_discovery.sh --test-type tags

# フォールバック設定のみテスト
./test_tag_discovery.sh --test-type fallback
```

## 実装詳細

### 検索ロジック

1. **タグベース検索**（デフォルト）
   - AWS CLIを使用してEC2インスタンスをタグで検索
   - 環境名に基づいてタグフィルターを構築
   - 複数のリージョンで検索（ap-northeast-1, ap-northeast-2, us-east-1, us-west-2）

2. **フォールバック機能**
   - タグベース検索が失敗した場合、ハードコードされた設定を使用
   - 設定ファイルの`ENV_CONFIGS`配列から値を取得

### 関数一覧

#### 新規追加関数

- `find_instance_by_tags(env_name, aws_profile, region)`: タグでインスタンス情報を取得
- `get_instance_id_by_tags(env_name, aws_profile, region)`: タグでインスタンスIDを取得
- `get_region_by_tags(env_name, aws_profile)`: タグでリージョンを検索

#### 拡張関数

- `get_env_config(env_name, config_type, aws_profile, use_tags)`: タグベース検索対応版

## 設定ファイル

### 環境設定（config.sh）

```bash
# ハードコードされた設定（フォールバック用）
readonly ENV_CONFIGS=(
    "com:i-0c8fd89c7abd78506:ap-northeast-1"
    "dev:i-0dd69094f78699749:ap-northeast-1"
    "stg:i-0ee79095f88700850:ap-northeast-1"
)
```

### CloudFormationテンプレート

```yaml
BastionHost:
  Type: AWS::EC2::Instance
  Properties:
    Tags:
      - Key: Name
        Value: !Sub ${ClusterName}-bastion
      - Key: Environment
        Value: !Ref ClusterName
      - Key: Type
        Value: bastion
      - Key: Purpose
        Value: eks-management
```

## トラブルシューティング

### よくある問題

1. **インスタンスが見つからない**
   - タグが正しく設定されているか確認
   - インスタンスが実行中か確認
   - AWSプロファイルの権限を確認

2. **AWS CLIエラー**
   - AWS CLIがインストールされているか確認
   - AWS認証情報が正しく設定されているか確認

3. **リージョンエラー**
   - インスタンスが存在するリージョンを確認
   - デフォルトリージョンが正しく設定されているか確認

### デバッグ方法

```bash
# 詳細なログを有効化
export DEBUG=1

# タグベース検索をテスト
./test_tag_discovery.sh --env dev --test-type tags

# AWS CLIで直接確認
aws ec2 describe-instances --filters "Name=tag:Name,Values=*dev*bastion*" --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0]]' --output table
```

## 今後の拡張

- 複数インスタンスの検出と選択機能
- より詳細なタグフィルター
- 自動リージョン検出の改善
- キャッシュ機能の追加
