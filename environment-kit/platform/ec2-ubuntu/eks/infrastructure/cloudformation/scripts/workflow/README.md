# EKS Infrastructure Workflow Scripts - Node.js版

このディレクトリには、従来のBashスクリプトをNode.jsに書き換えた基盤インフラデプロイメントワークフロースクリプトが含まれています。

## 特徴

### 非同期処理制御
- **Promise ベース**: 全ての処理がPromiseベースで実装され、適切な非同期制御を実現
- **エラーハンドリング**: 包括的なエラーハンドリングと適切なログ出力
- **プロセス管理**: 子プロセス（make, aws cli）の適切な管理とストリーミング出力
- **タイムアウト制御**: 長時間実行プロセスのタイムアウト制御機能

### モジュラー設計
- **設定管理**: YAML設定ファイルの読み込みと変数展開
- **ログ機能**: 色分けされたコンソール出力とファイルログ
- **AWS操作**: AWS CLI操作のラッパーとリソース管理
- **時間推定**: デプロイ時間の推定と進捗表示
- **通知機能**: Discord Webhook通知機能

## ファイル構成

```
workflow/
├── workflow-run-01-03.js     # メインワークフロースクリプト
├── package.json              # Node.js プロジェクト設定
├── README.md                 # このファイル
└── node_modules/             # 依存関係

../common/
├── config.js                 # 設定管理モジュール
├── logger.js                 # ログ機能モジュール
├── aws-resources.js          # AWS操作モジュール
├── utils.js                  # ユーティリティ機能
├── time-estimation.js        # 時間推定モジュール
└── discord-notification.js   # Discord通知モジュール
```

## 使用方法

### 基本的な実行

```bash
# Node.js版の実行
./workflow-run-01-03.js

# または
node workflow-run-01-03.js

# npm scriptで実行
npm run workflow-01-03
```

### 従来版との比較

```bash
# 従来のBash版
./workflow-run-01-03.sh

# Node.js版
./workflow-run-01-03.js
```

## 機能詳細

### 1. 非同期処理制御

```javascript
// 順次実行（従来のBashのような動作）
const workflow = [
    { name: '古いリソースのクリーンアップ', fn: cleanupOldResources },
    { name: '前提条件のデプロイ', fn: deployPrerequisites },
    { name: '前提条件の確認', fn: checkPrerequisitesDeployment }
];

for (const step of workflow) {
    await step.fn();
}

// 並列実行も可能
await Promise.all([
    task1(),
    task2(),
    task3()
]);
```

### 2. プロセス管理

```javascript
// makeコマンドの実行とリアルタイム出力
const make = spawn('make', [target], {
    cwd: WORK_DIR,
    stdio: 'pipe'
});

make.stdout.on('data', (data) => {
    logger.logInfo(data.toString().trim());
});

await new Promise((resolve, reject) => {
    make.on('close', (code) => {
        code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`));
    });
});
```

### 3. 設定管理

```javascript
// YAML設定ファイルの読み込みと変数展開
const config = new Config(WORK_DIR);
const projectName = config.get('basic.ProjectName'); // 'eks-platform'
const stackName = config.get('Stacks.Prerequisites'); // 'eks-platform-prerequisites-v2'
```

### 4. エラーハンドリング

```javascript
// 包括的なエラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
    logger.logError(`Unhandled Rejection: ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.logError(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});
```

## 環境要件

- Node.js >= 14.0.0
- AWS CLI (設定済み)
- yq (YAML処理用)
- make (Makefile実行用)

## インストール

```bash
# 依存関係のインストール
cd scripts/workflow
npm install
```

## 設定

### Discord通知の設定（オプション）

```bash
# 環境変数で設定
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# または config.yaml で設定
notifications:
  discord:
    webhookUrl: "https://discord.com/api/webhooks/..."
```

## 利点

### Bashスクリプトと比較した利点

1. **エラーハンドリング**: より細かく正確なエラー処理
2. **非同期制御**: 適切な非同期処理の管理
3. **モジュラー設計**: 再利用可能な機能モジュール
4. **プロセス管理**: 子プロセスの適切な管理
5. **ログ機能**: 構造化されたログ出力
6. **テスタビリティ**: ユニットテストが容易
7. **拡張性**: 新機能の追加が容易

### 従来版との互換性

- 同じMakefileターゲットを使用
- 同じ設定ファイル(config.yaml)を使用
- 同じログ出力形式を維持
- 同じ実行順序を保証

## トラブルシューティング

### よくある問題

1. **Node.jsのバージョン不適合**
   ```bash
   node --version  # 14.0.0以上を確認
   ```

2. **依存関係の問題**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **権限エラー**
   ```bash
   chmod +x workflow-run-01-03.js
   ```

4. **設定ファイルエラー**
   ```bash
   yq eval '.' ../../config.yaml  # 設定ファイルの検証
   ```

## 開発

### コード品質

```bash
# リンティング
npm run lint

# フォーマット
npm run format
```

### デバッグ

```bash
# デバッグモードで実行
DEBUG=true node workflow-run-01-03.js

# Node.jsデバッガーで実行
node --inspect workflow-run-01-03.js
```

## 将来の拡張

- [ ] TypeScript化
- [ ] ユニットテスト追加
- [ ] Slack通知対応
- [ ] メトリクス収集機能
- [ ] 設定バリデーション強化
- [ ] リトライロジック改善