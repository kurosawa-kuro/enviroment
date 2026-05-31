# WSL 環境セットアップ — クイックスタート

この文書は入口専用です。詳細仕様や判断基準は次の正本を参照してください。

- 仕様 / 設計: [01_仕様と設計.md](01_仕様と設計.md)
- 改善状況: [02_移行ロードマップ.md](02_移行ロードマップ.md)
- 実装一覧: [03_実装カタログ.md](03_実装カタログ.md)
- 実務手順: [04_運用.md](04_運用.md)

## 最短手順

すべて `platform/wsl-ubuntu/` 直下で実行します。

```bash
cd /home/ubuntu/repos/enviroment/platform/wsl-ubuntu

make setup-ansible
make test-base
make setup-base
make setup
make check
```

## よく使う追加導線

| やりたいこと | コマンド |
|---|---|
| ユーザー初期化（opt-in） | `make setup-user` |
| Rust だけ | `make test-rust` / `make setup-rust` |
| ドライラン | `make test` |
| ヘルプ | `make help` |

## 補足

- Java / Kotlin はオプションで、既定では入りません
- PostgreSQL のポート方針は [03_実装カタログ.md](03_実装カタログ.md) §5 を参照
- Windows 側の初手は [初期WSL設定.md](初期WSL設定.md) を参照
