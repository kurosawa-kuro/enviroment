# Hono Lambda デプロイガイド

AWS CLIを使用してHonoアプリをLambda + API Gateway HTTP APIにデプロイする手順

## 前提条件

- AWS CLIがインストール・設定済み
- Node.js 20.x
- ビルド済みの`lambda.zip`ファイル

## 1. AWSアカウントIDの確認

```bash
aws sts get-caller-identity --query Account --output text
```

## 2. IAMロールの作成

### 2.1 信頼ポリシーファイルの作成

`trust-policy.json`を作成:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 2.2 IAMロールの作成

```bash
aws iam create-role \
  --role-name lambda-hono-role \
  --assume-role-policy-document file://trust-policy.json \
  --description "IAM role for Hono Lambda function"
```

### 2.3 実行ポリシーのアタッチ

```bash
aws iam attach-role-policy \
  --role-name lambda-hono-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

## 3. Lambda関数の作成

```bash
aws lambda create-function \
  --function-name hono-lambda-hello \
  --runtime nodejs20.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/lambda-hono-role \
  --handler index.handler \
  --zip-file fileb://lambda.zip \
  --timeout 30 \
  --memory-size 256
```

> `<ACCOUNT_ID>`は自分のAWSアカウントIDに置き換える

## 4. API Gateway HTTP APIの作成

### 4.1 API作成とLambda統合

```bash
API_ID=$(aws apigatewayv2 create-api \
  --name hono-lambda-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:<REGION>:<ACCOUNT_ID>:function:hono-lambda-hello \
  --query 'ApiId' \
  --output text)

echo "API_ID: $API_ID"
```

> `<REGION>`と`<ACCOUNT_ID>`は自分の環境に置き換える（例: `ap-northeast-1`）

### 4.2 Lambda実行権限の付与

```bash
aws lambda add-permission \
  --function-name hono-lambda-hello \
  --statement-id ApiGatewayInvoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:<REGION>:<ACCOUNT_ID>:${API_ID}/*"
```

## 5. 動作確認

```bash
curl https://<API_ID>.execute-api.<REGION>.amazonaws.com/
```

期待される出力:
```
Hello Hono!
```

## コードの更新

コードを更新する場合:

```bash
# 再ビルド
npm run build

# zipファイルの更新
cd dist && zip -r lambda.zip index.js

# Lambda関数の更新
aws lambda update-function-code \
  --function-name hono-lambda-hello \
  --zip-file fileb://lambda.zip
```

## リソースの削除

不要になった場合の削除手順:

```bash
# API Gatewayの削除
aws apigatewayv2 delete-api --api-id <API_ID>

# Lambda関数の削除
aws lambda delete-function --function-name hono-lambda-hello

# IAMロールからポリシーをデタッチ
aws iam detach-role-policy \
  --role-name lambda-hono-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# IAMロールの削除
aws iam delete-role --role-name lambda-hono-role
```

## 作成されたリソース一覧

| リソース | 名前/値 |
|----------|----------|
| IAMロール | `lambda-hono-role` |
| Lambda関数 | `hono-lambda-hello` |
| API Gateway | `hono-lambda-api` |
| リージョン | `ap-northeast-1` |
| ランタイム | Node.js 20.x |

## API Gateway HTTP APIのメリット

- **シンプル**: 1コマンドでAPI作成とLambda統合が完了
- **低コスト**: REST APIより安価
- **Hono対応**: `ANY /{proxy+}`でHonoのルーティングをフル活用可能
- **自動デプロイ**: `$default`ステージが自動作成される
