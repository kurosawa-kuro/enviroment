# プロジェクト構造改善計画

## 🎯 目的

環境構築ノウハウの集約と管理効率の向上を図る

### 対象環境
- **WSL Ubuntu** - Ansible自動化
- **AWS EC2 Amazon Linux 2023** - user-script
- **AWS EC2 Ubuntu** - user-script

## 🚨 現状の重大な課題

### 1. セキュリティリスク（最優先）
**機密情報がハードコードされている**
- SSH秘密鍵が平文で保存
- AWS認証情報が平文で保存
- Discord Webhook URLが平文で保存

**影響範囲:**
- `script/ubuntu/user-script`
- `script/amazon-linux-2023/user-script`

### 2. プロジェクト構造の課題
- **重複コード**: 同じ機能が複数の場所に散在
- **一貫性の欠如**: 命名規則とディレクトリ構造の統一性不足
- **保守性の低下**: 変更時の影響範囲が不明確
- **ドキュメント分散**: 情報が複数の場所に散らばっている

### 3. 環境管理の課題
- **プラットフォーム固有の処理**: 共通化されていない
- **設定の重複**: 同じ設定が複数箇所で定義
- **テンプレート化不足**: 再利用可能な形になっていない

## 📁 提案する新しいプロジェクト構造

```
environment-kit/
├── README.md                           # プロジェクト概要
├── CLAUDE.md                          # Claude Code用指示書
├── Makefile                           # 主要コマンド
│
├── docs/                              # 📚 ドキュメント
│   ├── architecture/                  # アーキテクチャ設計
│   ├── setup-guides/                  # セットアップガイド
│   │   ├── wsl-ubuntu.md
│   │   ├── ec2-amazon-linux.md
│   │   └── ec2-ubuntu.md
│   ├── security/                      # セキュリティガイド
│   └── troubleshooting/               # トラブルシューティング
│
├── config/                            # 🔧 設定ファイル
│   ├── Environments/                  # 環境別設定
│   │   ├── wsl-ubuntu/
│   │   ├── ec2-amazon-linux/
│   │   └── ec2-ubuntu/
│   ├── templates/                     # 設定テンプレート
│   └── secrets/                       # 🔒 機密情報管理
│       ├── .env.template              # 環境変数テンプレート
│       ├── ssh-keys/                  # SSH鍵管理
│       └── aws-credentials/           # AWS認証情報管理
│
├── scripts/                           # 🚀 スクリプト
│   ├── common/                        # 共通ユーティリティ
│   │   ├── logging.sh                 # ログ機能
│   │   ├── security.sh                # セキュリティ機能
│   │   ├── validation.sh              # 検証機能
│   │   └── platform-detection.sh     # プラットフォーム検出
│   ├── platform/                      # プラットフォーム固有
│   │   ├── wsl-ubuntu/
│   │   │   ├── setup.sh               # メインセットアップ
│   │   │   ├── components/            # 機能別スクリプト
│   │   │   └── tests/                 # テストスクリプト
│   │   ├── ec2-amazon-linux/
│   │   │   ├── user-data.sh           # EC2 UserDataスクリプト
│   │   │   ├── components/
│   │   │   └── tests/
│   │   └── ec2-ubuntu/
│   │       ├── user-data.sh
│   │       ├── components/
│   │       └── tests/
│   └── deployment/                    # デプロイメント
│       ├── terraform-integration.sh
│       └── ansible-runner.sh
│
├── ansible/                           # 🤖 Ansible設定
│   ├── inventories/                   # インベントリ
│   ├── playbooks/                     # プレイブック
│   ├── roles/                         # ロール
│   └── group_vars/                    # 変数
│
├── infrastructure/                    # 🏗️ インフラ管理
│   ├── terraform/                     # Terraform設定
│   ├── cloudformation/                # CloudFormation
│   └── docker/                        # Docker設定
│
├── tools/                             # 🛠️ 開発ツール
│   ├── validators/                    # 検証ツール
│   ├── generators/                    # コード生成
│   └── monitors/                      # 監視ツール
│
└── tests/                             # 🧪 テスト
    ├── unit/                          # 単体テスト
    ├── integration/                   # 統合テスト
    └── e2e/                          # End-to-End テスト
```

## 🔒 セキュリティ改善計画

### 1. 機密情報の分離
```bash
# 新しい機密情報管理構造
config/secrets/
├── .env.template                      # 環境変数テンプレート
├── .gitignore                         # 機密ファイルを除外
├── README-SECURITY.md                 # セキュリティガイド
├── ssh-keys/
│   ├── key-generation.sh              # 鍵生成スクリプト
│   └── .gitkeep                       # 空ディレクトリ保持
└── aws-credentials/
    ├── setup-iam-role.sh              # IAMロール設定
    └── credential-manager.sh          # 認証情報管理
```

### 2. 環境変数による設定管理
```bash
# .env.template の例
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AwsRegion=ap-northeast-1
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
GIT_USER_NAME="Your Name"
GIT_USER_EMAIL="your.email@example.com"
SSH_KEY_PATH="/path/to/your/ssh/key"
```

### 3. セキュリティベストプラクティス
- AWS IAMロールの活用（EC2インスタンス用）
- SSH鍵の動的生成
- 機密情報の暗号化
- アクセス権限の最小化

## 🔄 移行戦略

### Phase 1: セキュリティ対応（最優先）
1. **機密情報の除去**
   - 既存ファイルから機密情報を削除
   - テンプレート化
   - 環境変数による管理

2. **セキュリティ検証**
   - Git履歴から機密情報を完全削除
   - .gitignore の強化

### Phase 2: 構造改善
1. **共通ライブラリの作成**
   - `scripts/common/` 配下の整備
   - 既存コードの共通化

2. **プラットフォーム別整理**
   - `scripts/platform/` への再編成
   - 重複コードの統合

### Phase 3: 自動化強化
1. **テストの追加**
   - 各スクリプトの単体テスト
   - 統合テストの実装

2. **CI/CD整備**
   - GitHub Actions での自動検証
   - セキュリティスキャンの自動化

## 🎯 実装優先度

### 🔴 緊急（即座に対応）
- [ ] 機密情報のハードコーディング除去
- [ ] セキュリティガイドラインの策定
- [ ] .gitignore の強化

### 🟡 高優先（1週間以内）
- [ ] 共通ライブラリの作成
- [ ] プラットフォーム別ディレクトリの整理
- [ ] 設定テンプレートの作成

### 🟢 中優先（1か月以内）
- [ ] テストスイートの実装
- [ ] ドキュメントの体系化
- [ ] CI/CDパイプラインの構築

### 🔵 低優先（継続的改善）
- [ ] 監視・ログ機能の強化
- [ ] パフォーマンス最適化
- [ ] 新機能の追加

## 🛡️ セキュリティチェックリスト

### 即座に実行すべき項目
- [ ] **Git履歴の機密情報削除**
  ```bash
  # BFGまたはgit filter-branchで履歴をクリーン
  git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch script/*/user-script' \
    --prune-empty --tag-name-filter cat -- --all
  ```

- [ ] **機密ファイルの.gitignore追加**
  ```gitignore
  # 機密情報
  config/secrets/*.env
  config/secrets/ssh-keys/*
  config/secrets/aws-credentials/*
  !config/secrets/**/.gitkeep
  !config/secrets/**/*.template
  ```

- [ ] **環境変数管理の導入**
  - dotenv ライブラリの使用
  - AWS Secrets Manager の検討
  - HashiCorp Vault の検討

### 継続的セキュリティ対策
- [ ] **自動スキャン設定**
  - git-secrets の導入
  - pre-commit hooks の設定
  - GitHub Security Scanning の有効化

- [ ] **アクセス制御**
  - 最小権限の原則
  - 定期的な権限見直し
  - 多要素認証の強制

## 📋 実装チェックリスト

### ディレクトリ作成
```bash
mkdir -p {docs/{architecture,setup-guides,security,troubleshooting},config/{Environments/{wsl-ubuntu,ec2-amazon-linux,ec2-ubuntu},templates,secrets/{ssh-keys,aws-credentials}},scripts/{common,platform/{wsl-ubuntu,ec2-amazon-linux,ec2-ubuntu}/{components,tests},deployment},tools/{validators,generators,monitors},tests/{unit,integration,e2e}}
```

### 既存ファイルの移行
- [ ] `script/` → `scripts/platform/` への移行
- [ ] `ansible/` の整理
- [ ] `iac/` → `infrastructure/` への移行
- [ ] ドキュメントファイルの整理

### 新規ファイル作成
- [ ] セキュリティガイド
- [ ] 環境別セットアップガイド
- [ ] 共通ライブラリスクリプト
- [ ] テストスクリプト

## 🔍 品質保証

### コード品質
- **静的解析**: ShellCheck による構文チェック
- **セキュリティ**: Bandit, git-secrets による脆弱性検査
- **テストカバレッジ**: bats による単体テスト

### ドキュメント品質
- **Markdown lint**: markdownlint による文書品質チェック
- **リンク検証**: 外部リンクの有効性確認
- **定期更新**: バージョンアップに伴う情報更新

## 📈 成功指標

### 定量指標
- [ ] 機密情報の完全除去（100%）
- [ ] テストカバレッジ（80%以上）
- [ ] セットアップ時間の短縮（50%改善）
- [ ] エラー発生率の低下（90%改善）

### 定性指標
- [ ] 保守性の向上
- [ ] 新環境追加の容易さ
- [ ] チーム内の知識共有の促進
- [ ] セキュリティ意識の向上

---

**⚠️ 重要な注意事項:**
この計画の実行前に、必ず機密情報が含まれた既存ファイルのセキュリティ対応を最優先で実施してください。Git履歴からの完全削除と、新しいセキュリティモデルの導入が急務です。
