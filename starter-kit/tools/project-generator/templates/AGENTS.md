# AGENTS.md

AI コーディングエージェント（Claude Code / Codex / GitHub Copilot 等）共通の作業ガイド。
ツール固有の指示は各ツールのファイル（例: `CLAUDE.md`）に置き、ここには共通方針のみ記す。

## プロジェクト概要

- 目的: TODO（何を作るか）
- 主要技術: TODO

## セットアップ / 主要コマンド

```bash
make setup    # 依存取得 + ビルド
make dev      # 開発サーバー
make test     # テスト
make fmt      # フォーマット
```

## コーディング規約

- 既存のコード・命名・パターンに合わせる。新規導入より既存の再利用を優先する。
- 変更後はテストとフォーマッタを実行してから完了とする。
- 非機密の設定値は `env/config.yaml`、ローカル秘密情報は `env/secret.yaml`、チーム共有・本番クレデンシャルは Doppler (`doppler.yaml`)。秘密情報をコミットしない。

## ドキュメント

設計・仕様・運用は `doc/` 配下を参照。更新規約と権威順位は [`doc/README.md`](doc/README.md) に従う。
仕様レベルの変更は連動するドキュメントを同一 PR でまとめて直す。
