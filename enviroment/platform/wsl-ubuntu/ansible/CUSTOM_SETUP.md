# カスタムセットアップガイド

## 選択的インストール方法

### 使い方

1. `config.yml` を編集:
```bash
cd ansible/
vim config.yml
```

2. 不要なコンポーネントを `enabled: false` に設定:
```yaml
java:
  enabled: false  # Java不要
postgresql:
  enabled: false  # PostgreSQL不要
```

3. カスタムセットアップを実行:
```bash
ansible-playbook site-selective.yml --ask-become-pass
```

## 設定例

### Web開発環境（Java不要）
```yaml
components:
  nodejs: { enabled: true }
  java: { enabled: false }     # Java不要
  kotlin: { enabled: false }   # Kotlin不要
  docker: { enabled: true }
  postgresql: { enabled: true }
```

### コンテナ開発環境（DB不要）
```yaml
components:
  docker: { enabled: true }
  kubernetes: { enabled: true }
  postgresql: { enabled: false }  # PostgreSQL不要
```

### 最小構成
```yaml
components:
  base: { enabled: true }
  docker: { enabled: true }
  aws: { enabled: true }
  # その他はすべて false
```