# GCP CLI Scripts

`gcloud` / `docker` / `bq` まわりの定型確認をまとめた補助スクリプト。

Public 公開前提のため、Project ID・Secret 名・値はすべて引数で渡す。スクリプト内に実プロジェクト名や秘密情報を持たせない。

## 前提

- `gcloud` CLI がインストール済み
- `gcloud auth login` または Workload Identity Federation 等で認証済み
- 操作対象の Project ID を明示する

## 一覧

| Script | 用途 |
|---|---|
| `gcp-auth-check.sh` | 認証アカウント、ADC、project、region、主要 API 状態を確認 |
| `gcp-enable-services.sh` | Cloud Run / Artifact Registry / Secret Manager などの主要 API を有効化 |
| `gcp-artifact-registry-docker-auth.sh` | Artifact Registry の Docker 認証を設定 |
| `gcp-cloud-run-inspect.sh` | Cloud Run Service / Job の状態・revision・直近ログを確認 |
| `gcp-secret-upsert.sh` | Secret Manager に secret container と新 version を作成 |

## 使い方

```bash
script/gcp/gcp-auth-check.sh --project your-project --region asia-northeast1
script/gcp/gcp-enable-services.sh --project your-project
script/gcp/gcp-artifact-registry-docker-auth.sh --project your-project --region asia-northeast1
script/gcp/gcp-cloud-run-inspect.sh --project your-project --region asia-northeast1 --service your-service
printf '%s' "$TOKEN" | script/gcp/gcp-secret-upsert.sh --project your-project --secret your-secret
```

## 安全ルール

- secret 値は標準入力から渡す。コマンド履歴に値を残さない。
- 実 Project ID / Account ID / Secret 名を README やテンプレートへ固定しない。
- 削除系操作はここに置かない。必要な場合はプロジェクト側で明示的に作る。
