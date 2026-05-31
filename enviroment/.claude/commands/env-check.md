---
description: WSL Ubuntu 環境にインストール済みのツール/バージョンを確認する
argument-hint: "(任意) 注目したいツール名"
---
`platform/wsl-ubuntu/` の環境構築状態を確認してください。

手順:
1. `platform/wsl-ubuntu/` に降りて、文書化済みターゲット `make check-versions`（無ければ `make check`）を実行する。
2. 出力から各ツールの導入状況とバージョンを表にまとめて報告する。
3. $ARGUMENTS が指定されていれば、そのツールの状態を重点的に確認する。

注意:
- このリポジトリの運用ルール（[CLAUDE.md](../../CLAUDE.md) / [AGENTS.md](../../AGENTS.md)）に従い、**文書化済みの Makefile ターゲットのみ**を使う。独自フラグや未定義コマンドを足さない。
- 実機/クラウドに影響する `make setup` / `make ansible-install` 等は確認なしに実行しない。
