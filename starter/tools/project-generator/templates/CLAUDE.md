# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドを提供する。

## コマンド

```bash
make setup    # 初期セットアップ (依存取得 + ビルド)
make build    # ビルド
make run      # 実行
make dev      # 開発サーバー / ホットリロード
make test     # テスト
make fmt      # フォーマット
make lint     # 静的解析
```

## アーキテクチャ

- ソースは `src/` 配下に置く。
- 非機密の設定は `env/config.yaml`、ローカル秘密情報は `env/secret.yaml`、チーム共有・本番クレデンシャルは Doppler (`doppler.yaml`) で管理する。
- 設計・運用ドキュメントは `doc/` 配下。権威順位と更新規約は [`doc/README.md`](doc/README.md) に従う。

## 作業ルール

- 推測でコードを書かない。コマンドを書いたら実際に実行して確認する。
- 仕様変更は連動するドキュメント（`doc/01`〜`doc/04`）を同一 PR で直す。drift を作らない。
- 既存の関数・ユーティリティ・パターンを優先的に再利用する。
