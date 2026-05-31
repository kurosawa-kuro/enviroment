# terraform

最小構成の Terraform (IaC) スターター。**GCP 優先**、AWS はコメントで補足。
インフラ構成管理 / クラウドリソース管理 / 環境構築の出発点に。

## 使い方

```bash
make init                 # 初期化
make fmt                  # フォーマット
make validate             # 構文・整合チェック
cp environments/dev.tfvars.example environments/dev.tfvars
make plan ENV=dev         # 差分確認 (environments/dev.tfvars)
make apply ENV=dev        # 適用
make plan ENV=prod        # 本番環境
```

ローカルで構文確認だけしたい場合:

```bash
terraform init -backend=false
terraform validate
```

## 構成

```
terraform/
├── versions.tf       # required_version / providers / backend(雛形)
├── providers.tf      # provider 設定 (google)
├── variables.tf      # project_id / region / env など
├── main.tf           # リソース定義 (雛形・locals)
├── outputs.tf        # 出力値
└── environments/
    ├── dev.tfvars.example    # 環境別変数サンプル
    └── prod.tfvars.example
```

## カスタマイズ

- `environments/*.tfvars.example` を `*.tfvars` にコピーして実値を入れる。
  `*.tfvars` はコミットしない。
- `make plan` / `make apply` / `make destroy` は、対応する `*.tfvars` が無い場合に作成手順を表示して停止する。
- リモートステートを使う場合は `versions.tf` の `backend "gcs"` を有効化し、
  事前に state 用 GCS バケットを作成する。
- AWS を使う場合は `versions.tf` / `providers.tf` / `variables.tf` の AWS 関連
  コメントを外す。
- 実リソースは `main.tf` に追加する（例: `google_project_service`, Cloud Run,
  Artifact Registry など）。
