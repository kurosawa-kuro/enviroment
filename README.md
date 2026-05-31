# private-kit

`private-kit` は、環境構築資産とスターターキットを並べて管理する親ディレクトリです。

## ディレクトリ構成

- [`enviroment/`](./enviroment/)
  - WSL Ubuntu、EC2 Ubuntu、Amazon Linux 向けの環境構築資産
- [`starter/`](./starter/)
  - 新規プロジェクト作成に使うスターターキット集

## 使い分け

- ローカル環境、Ansible、Docker、クラウド CLI、PostgreSQL、user-data まわりを触るとき
  - [`enviroment/README.md`](./enviroment/README.md)
- 雛形、テンプレート、project generator、技術スターターを触るとき
  - [`starter/README.md`](./starter/README.md)

## 補足

- ルートの `README.md` / `AGENTS.md` / `CLAUDE.md` は入口専用です
- 詳細な運用ルールは、それぞれの配下にある文書を参照してください
