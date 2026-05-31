# Doppler

シークレット管理プラットフォーム。環境変数やAPIキーを安全に一元管理し、開発・ステージング・本番環境間で同期できます。

## セットアップ

### 1. Doppler CLIのインストール

```bash
# macOS
brew install dopplerhq/cli/doppler

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | sudo gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/doppler-cli.list
sudo apt-get update && sudo apt-get install doppler

# Windows (Scoop)
scoop bucket add doppler https://github.com/DopplerHQ/scoop-doppler.git
scoop install doppler
```

### 2. 認証

```bash
doppler login
```

ブラウザが開き、Dopplerアカウントで認証します。

### 3. プロジェクト設定

```bash
# プロジェクトディレクトリで初期化
doppler setup

# または直接指定
doppler setup --project my-project --config dev
```

## 基本的な使い方

### シークレットの確認

```bash
# 一覧表示
doppler secrets

# 特定のシークレットを取得
doppler secrets get DATABASE_URL

# JSON形式で出力
doppler secrets --json
```

### シークレットの設定

```bash
# 単一のシークレットを設定
doppler secrets set API_KEY=your-api-key

# 複数のシークレットを一度に設定
doppler secrets set API_KEY=key1 SECRET_TOKEN=token1
```

### アプリケーションの実行

```bash
# 環境変数を注入して実行
doppler run -- node app.js
doppler run -- python main.py
doppler run -- go run main.go

# 特定の環境を指定
doppler run --config production -- npm start
```

### .envファイルの生成

```bash
# .envファイルとしてダウンロード
doppler secrets download --no-file --format env > .env

# 特定の環境から
doppler secrets download --config staging --no-file --format env > .env.staging
```

## 環境（Config）の管理

Dopplerでは環境を「Config」として管理します。

```
Project
├── dev          # 開発環境
├── staging      # ステージング環境
└── production   # 本番環境
```

```bash
# 環境の切り替え
doppler setup --config staging

# 環境間でシークレットを比較
doppler secrets --config dev --json > dev.json
doppler secrets --config production --json > prod.json
diff dev.json prod.json
```

## CI/CDでの利用

### GitHub Actions

```yaml
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Doppler CLI
        uses: dopplerhq/cli-action@v3

      - name: Run with secrets
        run: doppler run -- npm run deploy
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

### サービストークンの作成

CI/CD用のトークンを作成します（ダッシュボードまたはCLI）。

```bash
# サービストークンを作成
doppler configs tokens create ci-token --config production
```

## SDK連携

### Node.js

```bash
npm install @dopplerhq/node-sdk
```

```javascript
const { DopplerSDK } = require("@dopplerhq/node-sdk");

const doppler = new DopplerSDK({
  accessToken: process.env.DOPPLER_TOKEN,
});

const secrets = await doppler.secrets.list({
  project: "my-project",
  config: "production",
});
```

### Python

```bash
pip install doppler-sdk
```

```python
from doppler_sdk import DopplerSDK

doppler = DopplerSDK()
doppler.set_access_token(os.environ["DOPPLER_TOKEN"])

secrets = doppler.secrets.list(
    project="my-project",
    config="production"
)
```

## ベストプラクティス

1. **環境ごとにConfigを分離** - dev/staging/productionを明確に分ける
2. **サービストークンの最小権限** - CI/CDには読み取り専用トークンを使用
3. **ローカル開発でもDopplerを使用** - `.env`ファイルの共有を避ける
4. **シークレットのローテーション** - 定期的にAPIキーを更新

## トラブルシューティング

```bash
# 認証状態の確認
doppler whoami

# 設定の確認
doppler configure --all

# デバッグモード
doppler run --debug -- node app.js

# キャッシュのクリア
doppler configure reset
```

## 参考リンク

- [Doppler公式ドキュメント](https://docs.doppler.com/)
- [Doppler CLI リファレンス](https://docs.doppler.com/docs/cli)
- [GitHub Actions連携](https://docs.doppler.com/docs/github-actions)
