# EKS Backend API Deployment

## 概要
Docker Hubに格納されているバックエンドAPI（ポート8000）をEKSクラスターにデプロイするためのKubernetesマニフェストファイル。

## ファイル構成

- `deployment.yaml` - バックエンドAPIのDeployment定義
- `service.yaml` - LoadBalancer Service定義  
- `configmap.yaml` - 環境変数設定用ConfigMap

## デプロイ手順

### 1. 前提条件
- EKSクラスターが作成済み
- kubectlがインストール済み
- AWS CLIが設定済み

### 2. EKSクラスターへの接続設定

```bash
# CloudFormationでEKSクラスターをデプロイ（未実行の場合）
cd /home/wsl/local_ubuntu/environment-kit/platform/ec2-ubuntu/iac/cloud-formation
make deploy-eks

# デプロイ状態確認（CREATE_COMPLETEになるまで待つ）
make status-eks

# kubeconfigを更新してEKSクラスターに接続
make update-kubeconfig

# または直接AWS CLIで実行
aws eks update-kubeconfig --region ap-northeast-1 --name simple-eks-platform

# 接続確認
kubectl get nodes
```

### 3. Docker Hubイメージ
使用イメージ: `kurosawakuro/api-nodejs-k8s:latest`

### 4. デプロイ実行

```bash
# k8sディレクトリに移動
cd /home/wsl/local_ubuntu/environment-kit/platform/ec2-ubuntu/iac/cloud-formation/k8s

# ConfigMapをデプロイ
kubectl apply -f configmap.yaml

# Deploymentをデプロイ
kubectl apply -f deployment.yaml

# Serviceをデプロイ
kubectl apply -f service.yaml
```

### 5. 状態確認

```bash
# Pod状態確認
kubectl get pods -l app=backend-api

# Service確認
kubectl get service backend-api-service

# LoadBalancerのエンドポイント確認
kubectl describe service backend-api-service
```

### 6. アクセス確認

LoadBalancerのExternal IPまたはDNS名を使用してアクセス：

```bash
# ヘルスチェック
curl http://<EXTERNAL-IP>/health

# API確認
curl http://<EXTERNAL-IP>/api
```

## 削除手順

```bash
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete -f configmap.yaml
```

## カスタマイズ

### レプリカ数の変更
`deployment.yaml`の`replicas`値を変更

### リソース制限の調整
`deployment.yaml`の`resources`セクションを環境に応じて調整

### 環境変数の追加
`configmap.yaml`に必要な環境変数を追加
