# rust-cli

最小構成の Rust CLI スターター（`clap` derive + `anyhow`）。
小規模ツール / 高速ユーティリティ / バッチの入口に。

## 使い方

```bash
make build              # ビルド
make greet              # 例: greet サブコマンド実行 -> "Hello, world!"
cargo run -- greet Alice   # 引数付き実行 -> "Hello, Alice!"
cargo run -- --help        # ヘルプ
make test               # テスト
make fmt                # フォーマット
make clippy             # Lint
```

## 構成

```
rust-cli/
├── Cargo.toml      # clap(derive) + anyhow
├── env/
│   └── config.yaml # 公開してよい一般設定サンプル
├── src/main.rs     # Parser + Subcommand (greet)
└── Makefile        # setup/build/run/test/fmt/clippy
```

サブコマンドを追加する場合は `src/main.rs` の `enum Commands` に variant を足し、
`match` 節に処理を追加する。

## 設定

- `env/config.yaml` は公開してよい一般設定だけにする。
- 秘密情報が必要になったら `env/secret.yaml` や `.env` を使い、コミットしない。
- 現在の CLI はコマンドライン引数を主に使う。`env/config.yaml` は将来拡張用の既定値置き場。
