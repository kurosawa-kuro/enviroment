# AGENTS.md

このファイルは、AI コーディングアシスタントが `/home/ubuntu/repos/private-kit/enviroment` で作業するときの共通ガイドです。詳細な背景説明は [`CLAUDE.md`](./CLAUDE.md) を参照しつつ、日常的な作業判断は本ファイルを優先してください。

## 1. リポジトリ概要

このリポジトリは、開発環境とインフラ周辺のセットアップ資産をまとめた環境構築用リポジトリです。主な対象は次の 3 系統です。

- `platform/wsl-ubuntu/`
  - WSL Ubuntu 向けの Ansible ベース環境構築
- `platform/ec2-ubuntu/`
  - Ubuntu on EC2、および EKS 学習用構成
- `platform/ec2-amazon-linux/`
  - Amazon Linux 向けの user-data / セットアップスクリプト

補助スクリプトは `script/`、補足ドキュメントは `docs/` にあります。

## 2. まず見る場所

- [`README.md`](./README.md)
- [`CLAUDE.md`](./CLAUDE.md)
- [`platform/wsl-ubuntu/README.md`](./platform/wsl-ubuntu/README.md)
- [`platform/wsl-ubuntu/ansible/README.md`](./platform/wsl-ubuntu/ansible/README.md)
- [`platform/ec2-ubuntu/eks/docs/deployment-guide.md`](./platform/ec2-ubuntu/eks/docs/deployment-guide.md)

実装やドキュメントを直す前に、対象領域の README と Makefile を確認してから変更すること。

## 3. 主要作業領域

### WSL Ubuntu Ansible

- 入口: `platform/wsl-ubuntu/`
- 中核:
  - `Makefile`
  - `ansible/site.yml`
  - `ansible/group_vars/all.yml`
  - `ansible/requirements.yml`
  - `ansible/roles/*`

バージョンや共通設定は、まず `platform/wsl-ubuntu/ansible/group_vars/all.yml` と `ansible.cfg` を確認すること。

### Docker Database

- 入口: `platform/wsl-ubuntu/docker-database/`
- 中核:
  - `Makefile`
  - `docker/`
  - `node-pg/`

DB 関連の変更は、接続確認コードと Docker 定義の整合も合わせて見ること。

### EC2 Ubuntu / EKS

- 入口: `platform/ec2-ubuntu/`
- 中核:
  - `ec2/Makefile`
  - `eks/Makefile`
  - `eks/infrastructure/cloudformation/`
  - `eks/infrastructure/kubernetes/`
  - `eks/applications/backend/`

アプリ変更だけで済みそうに見えても、デプロイ手順書や Kubernetes 定義に影響がないか確認すること。

### EC2 Amazon Linux

- 入口: `platform/ec2-amazon-linux/user-data/`
- 中核:
  - `setup.sh`
  - `check-versions.sh`
  - `user-script`

## 4. よく使うコマンド

### WSL Ubuntu

```bash
cd platform/wsl-ubuntu
make help
make ansible-install
make ansible-install-check
make ansible-test
make check-versions
make generate-requirements
```

### Docker Database

```bash
cd platform/wsl-ubuntu/docker-database
make start-db
make start-db-local
make start-db-test
make start-db-dwh
make stop-db
```

### EC2 Ubuntu / EKS

```bash
cd platform/ec2-ubuntu/ec2
make help

cd platform/ec2-ubuntu/eks
make help

cd platform/ec2-ubuntu/eks/applications/backend
make test
```

コマンド追加や置換を提案する前に、既存 Makefile ターゲットで代替できないかを必ず確認すること。

## 5. 変更時の原則

- 変更は対象ディレクトリに閉じる。無関係なリファクタはしない。
- 既存の命名やディレクトリ構成を崩さない。
- バージョン番号を変える場合は、関連ドキュメントや参照先も追従確認する。
- `README.md`、`docs/`、スクリプト実体の 3 点で不整合を作らない。
- 機密情報、個人情報、実運用シークレットを新規追加しない。

## 6. ドキュメント更新ルール

- 実在しないディレクトリやコマンドを新たに書かない。
- サンプルコマンドは、このリポジトリ内で確認できるパスに合わせる。
- 日本語ドキュメントは日本語で統一し、英語見出しを増やしすぎない。
- 古い構成を説明している箇所を見つけたら、コード実体を基準に更新する。

## 7. 作業前チェック

- 対象ファイルがどのプラットフォーム配下か確認する
- 対応する README / Makefile / 実装本体を読む
- 既存変更が入っている場合は上書きせず共存方針を取る
- 実行確認できるなら最小限のコマンドで検証する

## 8. 作業禁止事項

- ユーザーが作成した既存差分を勝手に巻き戻さない
- 破壊的な Git 操作を行わない
- 実機やクラウドに影響する操作を、確認なしに拡大実行しない
- 参照元不明の手順を README や AGENTS に断定的に追記しない

## 9. 補足

`CLAUDE.md` には背景説明や強めの運用ルールがありますが、現状のリポジトリ実体とずれている箇所がありえます。判断に迷う場合は、まずファイルシステム上の実在パス・Makefile・README を正として扱ってください。
