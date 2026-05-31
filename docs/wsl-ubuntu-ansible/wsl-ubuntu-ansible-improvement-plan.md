# WSL Ubuntu Ansible 改善計画

## 📋 現状分析

### 現在の構成
- **メインPlaybook**: `ansible/site.yml`
- **スクリプト群**: `script/wsl/ubuntu/`
- **設定管理**: `ansible/group_vars/all.yml`
- **実行方法**: `make playbook` でワンコマンド実行

### 現在の強み
- ✅ ワンコマンドでの環境構築（`make playbook`）
- ✅ 包括的なツールセット（開発、インフラ、データベース）
- ✅ バージョン管理の一元化
- ✅ 詳細なバージョンチェック機能

## 🎯 改善目標

### 1. 運用性の向上
- エラーハンドリングの強化
- ログ管理の改善
- 実行時間の最適化
- 冪等性の確保

### 2. 保守性の向上
- コード品質の向上
- ドキュメントの充実
- テスト機能の追加

### 3. 拡張性の向上
- モジュール化の推進
- 設定の柔軟性向上
- 新しいツールの追加容易性

## 🔧 具体的改善項目

### A. スクリプト構造の改善

#### 現状の課題
```bash
# setup-openssh.sh - エラーハンドリングが不十分
sudo apt update && sudo apt install -y openssh-server
sudo ssh-keygen -A
```

#### 改善案
```bash
#!/bin/bash
set -euo pipefail

# ログ機能付きエラーハンドリング
source "$(dirname "$0")/common/logging.sh"

setup_openssh() {
    log_info "OpenSSH セットアップを開始します..."
    
    if ! command -v ssh &> /dev/null; then
        log_info "OpenSSH サーバーをインストールします..."
        sudo apt update || { log_error "apt update failed"; exit 1; }
        sudo apt install -y openssh-server || { log_error "OpenSSH installation failed"; exit 1; }
    else
        log_success "OpenSSH は既にインストールされています"
    fi
    
    setup_ssh_keys
    configure_ssh_daemon
    start_ssh_service
}
```

### B. Ansible Role の構造化

#### 現状の課題
- 一部のタスクが単一ファイルに集中
- 条件分岐の複雑化
- 再利用性の低さ

#### 改善案: Role 細分化
```
ansible/roles/
├── base/                    # システム基盤
│   ├── tasks/main.yml
│   ├── handlers/main.yml
│   └── defaults/main.yml
├── ssh/                     # SSH設定専用
│   ├── tasks/main.yml
│   ├── templates/sshd_config.j2
│   └── handlers/main.yml
├── development-runtime/     # 開発環境
│   ├── tasks/
│   │   ├── main.yml
│   │   ├── nodejs.yml
│   │   ├── golang.yml
│   │   └── java.yml
│   └── defaults/main.yml
└── monitoring/             # 監視・ログ
    ├── tasks/main.yml
    └── templates/logrotate.j2
```

### C. 設定管理の改善

#### 現状: 単一設定ファイル
```yaml
# ansible/group_vars/all.yml (500行+)
tool_versions:
  terraform: "1.6.6"
  nodejs: "20.x"
  # ... 全ての設定が混在
```

#### 改善案: 設定ファイル分割
```
ansible/
├── group_vars/
│   ├── all/
│   │   ├── main.yml           # 基本設定
│   │   ├── tools.yml          # ツールバージョン
│   │   ├── database.yml       # DB設定
│   │   ├── kubernetes.yml     # K8s設定
│   │   └── security.yml       # セキュリティ設定
│   └── local/
│       └── overrides.yml      # 環境固有設定
```

### D. エラーハンドリング強化

#### 現状の課題
```yaml
# 現在: エラー時の処理が不十分
- name: Install packages
  apt:
    name: "{{ packages }}"
    state: present
```

#### 改善案
```yaml
- name: Install essential packages
  block:
    - name: Update package cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      retries: 3
      delay: 10
      
    - name: Install packages with retry
      apt:
        name: "{{ item }}"
        state: present
      loop: "{{ essential_packages }}"
      retries: 2
      delay: 5
      register: package_install
      
  rescue:
    - name: Log installation failure
      debug:
        msg: "Package installation failed: {{ package_install.results }}"
        
    - name: Attempt alternative installation
      include_tasks: alternative_install.yml
      
  always:
    - name: Verify critical packages
      command: "{{ item }} --version"
      loop: "{{ critical_commands }}"
      register: version_check
      failed_when: false
```

### E. テスト機能の追加

#### 新規: テストPlaybook
```yaml
# ansible/tests/test-Environment.yml
---
- name: Environment Test Suite
  hosts: local
  tasks:
    - name: Test essential commands
      command: "{{ item }} --version"
      loop:
        - git
        - docker
        - kubectl
        - terraform
      register: cmd_tests
      failed_when: cmd_tests.rc != 0
      
    - name: Test service availability
      uri:
        url: "{{ item.url }}"
        method: GET
        status_code: 200
      loop:
        - { url: "http://localhost:5432", name: "PostgreSQL" }
      when: test_services | default(false)
      
    - name: Generate test report
      template:
        src: test_report.j2
        dest: "/tmp/ansible-test-report-{{ ansible_date_time.epoch }}.html"
```

### F. ログ管理とモニタリング

#### 改善案: 統合ログシステム
```bash
# script/common/logging.sh
#!/bin/bash

LOG_DIR="/var/log/wsl-setup"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d-%H%M%S).log"

setup_logging() {
    sudo mkdir -p "$LOG_DIR"
    sudo chown "$USER:$USER" "$LOG_DIR"
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
}

log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    log_with_timestamp "✅ SUCCESS: $1"
}

log_error() {
    log_with_timestamp "❌ ERROR: $1"
}

log_warning() {
    log_with_timestamp "⚠️  WARNING: $1"
}
```

## 📊 実装計画

### Phase 1: 基盤整備 (1-2週間)
1. **共通ライブラリ作成**
   - `script/common/logging.sh`
   - `script/common/utils.sh`
   - `script/common/validation.sh`

2. **設定ファイル分割**
   - `group_vars` の構造化
   - 環境別設定の分離

### Phase 2: Role リファクタリング (2-3週間)
1. **既存Role の分割**
   - `common` → `base`, `ssh`, `repositories`
   - `development` → 言語別Role

2. **新規Role 作成**
   - `monitoring`
   - `security`
   - `backup`

### Phase 3: テスト・検証機能 (1-2週間)
1. **テストPlaybook 作成**
2. **継続的検証機能**
3. **レポート機能**

### Phase 4: ドキュメント整備 (1週間)
1. **操作手順書更新**
2. **トラブルシューティングガイド**
3. **拡張ガイド**

## 🎯 期待効果

### 短期効果
- ✅ エラー時の原因特定が容易
- ✅ 実行ログの追跡可能
- ✅ 部分的な再実行が可能

### 中期効果
- ✅ 新しいツールの追加が簡単
- ✅ 環境固有の設定が分離
- ✅ テスト自動化による品質向上

### 長期効果
- ✅ 他環境への移植が容易
- ✅ チーム開発での共有が可能
- ✅ メンテナンス工数の削減

## 📝 実装優先度

### 🔴 高優先度
1. ログ機能とエラーハンドリング強化
2. 設定ファイルの分割
3. 基本的なテスト機能

### 🟡 中優先度
1. Role の細分化
2. 継続的検証機能
3. ドキュメント整備

### 🟢 低優先度
1. 高度な監視機能
2. バックアップ機能
3. GUI管理ツール

## 🚀 Next Steps

1. **Phase 1 の開始**: 共通ライブラリとログ機能の実装
2. **プロトタイプ作成**: 1つのRoleで改善案を検証
3. **段階的移行**: 既存機能を壊さずに改善を適用
4. **フィードバック収集**: 実際の使用感を基に調整

---

*この改善計画により、WSL Ubuntu Ansible環境はより堅牢で保守しやすいものになります。*

全体的にansibleをリファクタリング依頼