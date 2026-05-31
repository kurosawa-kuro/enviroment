# MongoDB Atlas Connection Test

MongoDB Atlasへの接続確認用のシンプルなNode.jsサンプルです。Dopplerとの連携も含まれています。

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

## 使用方法

### 方法1: 直接接続URL使用
```bash
npm start
```

### 方法2: 環境変数使用
```bash
# 環境変数を設定
export MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/news-app?retryWrites=true&w=majority"

# 実行
npm run start:env
```

### 方法3: Doppler使用（推奨）
```bash
# Doppler経由で実行
npm run start:doppler

# または直接実行
doppler run node connection-test-doppler.js
```

## テスト内容

このサンプルは以下のテストを実行します：

1. データベース接続確認
2. MongoDB バージョン取得
3. サーバー時刻取得
4. データベース一覧取得
5. コレクション一覧取得

## ファイル構成

- `connection-test-direct.js` - 直接接続URLを使用した接続テスト
- `connection-test-env.js` - 環境変数を使用した接続テスト
- `connection-test-doppler.js` - Dopplerを使用した接続テスト（推奨）
- `package.json` - プロジェクト設定と依存関係

## 注意事項

- 接続URLには機密情報が含まれているため、本番環境ではDopplerを使用してください
- このサンプルは接続確認のみを目的としており、実際のアプリケーションでは適切なエラーハンドリングとセキュリティ対策を実装してください
- Dopplerを使用することで、シークレットの安全な管理と環境別の設定管理が可能になります

## MongoDB Atlas 設定

### 接続文字列形式
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 必要な設定
- MongoDB Atlas アカウント
- クラスターの作成
- データベースユーザーの作成
- IP アクセスリストの設定（開発時は 0.0.0.0/0 を許可）
