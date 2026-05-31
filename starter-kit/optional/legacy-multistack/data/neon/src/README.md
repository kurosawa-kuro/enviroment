# Neon Database Connection Test

Neonデータベースへの接続確認用のシンプルなNode.jsサンプルです。Dopplerとの連携も含まれています。

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
export NEON_DB_URL="postgresql://user:password@host.neon.tech/database?sslmode=require&channel_binding=require"

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

1. ✅ データベース接続確認
2. 📋 PostgreSQL バージョン取得
3. 🕐 現在時刻取得
4. 🗄️ データベース名取得

## ファイル構成

- `connection-test-direct.js` - 直接接続URLを使用した接続テスト
- `connection-test-env.js` - 環境変数を使用した接続テスト
- `connection-test-doppler.js` - Dopplerを使用した接続テスト（推奨）
- `package.json` - プロジェクト設定と依存関係

## 注意事項

- 接続URLには機密情報が含まれているため、本番環境ではDopplerを使用してください
- このサンプルは接続確認のみを目的としており、実際のアプリケーションでは適切なエラーハンドリングとセキュリティ対策を実装してください
- Dopplerを使用することで、シークレットの安全な管理と環境別の設定管理が可能になります 


2. 外部ストレージに置いてランタイムでフェッチする
static_data.json を S3 や Google Cloud Storage、CDN（Cloudflare R2 など）に置き、

python
コピーする
編集する
import requests
data = requests.get("https://your-bucket.example.com/static_data.json").json()
のように起動時・再読み込み時にフェッチすれば、アプリ再デプロイ不要でデータだけ差し替えられます。

メリット

データ更新とアプリのリリースを分離できる

デプロイ不要で更新可能

デメリット

外部ストレージ／認証の実装が必要

ネットワーク呼び出しが増え、起動が若干遅くなる可能性
