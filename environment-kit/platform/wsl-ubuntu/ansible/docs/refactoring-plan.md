# WSL Ubuntu Environment Refactoring Plan

> **⚠️ 本書は背景メモです。現行仕様や採否判断の正本ではありません。**
> 改善提案の採用状況・未着手項目は [`docs/wsl-ubuntu-ansible/02_移行ロードマップ.md`](../../../../docs/wsl-ubuntu-ansible/02_移行ロードマップ.md) を正としてください。
> 本書は、過去に検討したリファクタ案の経緯把握用に残しています。

## Overview

現在のWSL Ubuntu環境セットアップは基礎機能が整い、本格的な運用段階に入っています。このドキュメントは、保守性・拡張性・セキュリティを向上させるためのリファクタリング計画を定義します。

## Current State Analysis

### 現在の構成

**主要コンポーネント:**
- Ansible Playbook (`site.yml`)
- 6つの主要ロール (base, development-runtime, docker, kubernetes, aws, postgresql)
- 一元化された設定管理 (`group_vars/all.yml`)
- Makefile ベースの自動化

**強み:**
- ✅ 一元化されたバージョン管理
- ✅ モジュラー設計（役割ベース）
- ✅ 豊富なツールセット（130+ ツール）
- ✅ セキュリティツールの包括的サポート
- ✅ クリアなドキュメント

**改善点:**
- 🔄 ロール間の依存関係が不明確
- 🔄 テスト・バリデーション機能の不足
- 🔄 ロールバック・復旧機能の欠如
- 🔄 ログ・監査機能の不十分さ
- 🔄 パフォーマンス最適化の余地

## Refactoring Priorities

### Priority 1: Core Infrastructure (重要度: 高)

#### 1.1 Role Dependency Management
**目的:** ロール間の依存関係を明確化し、安全なインストール順序を保証

**実装:**
```yaml
# roles/*/meta/main.yml の例
---
dependencies:
  - role: base
    when: ansible_role_name != 'base'

galaxy_info:
  role_name: "{{ ansible_role_name }}"
  min_ansible_version: "2.14"
  platforms:
    - name: Ubuntu
      versions:
        - jammy
        - focal
```

**タスク:**
- [ ] 各ロールに `meta/main.yml` を追加
- [ ] 依存関係マッピングの作成
- [ ] 循環依存の検出・解決

#### 1.2 Validation and Testing Framework
**目的:** インストール結果の検証とテスト自動化

**実装:**
```yaml
# roles/*/tasks/validate.yml の例
---
- name: "Validate {{ ansible_role_name }} installation"
  block:
    - name: "Check if {{ item.name }} is installed"
      command: "{{ item.cmd }}"
      register: version_check
      failed_when: version_check.rc != 0
      loop: "{{ validation_commands }}"
      when: validation_commands is defined

    - name: "Test {{ ansible_role_name }} functionality"
      include_tasks: "functional_test.yml"
      when: functional_tests is defined

  rescue:
    - name: "Log validation failure"
      debug:
        msg: "Validation failed for {{ ansible_role_name }}"
    
    - name: "Record failed role"
      set_fact:
        failed_roles: "{{ failed_roles | default([]) + [ansible_role_name] }}"
```

**タスク:**
- [ ] 各ロールにバリデーションタスクを追加
- [ ] 統合テストスイートの作成
- [ ] CI/CD パイプライン用テストの実装

#### 1.3 Error Handling and Recovery
**目的:** 障害時の自動復旧とロールバック機能

**実装:**
```yaml
# playbooks/recovery.yml の例
---
- name: Recovery playbook for failed installations
  hosts: localhost
  gather_facts: yes
  vars:
    recovery_strategies:
      base: "recovery/base_recovery.yml"
      docker: "recovery/docker_recovery.yml"
      kubernetes: "recovery/k8s_recovery.yml"
  
  tasks:
    - name: "Attempt recovery for failed roles"
      include_tasks: "{{ recovery_strategies[item] }}"
      loop: "{{ failed_roles | default([]) }}"
      when: 
        - failed_roles is defined
        - item in recovery_strategies
      ignore_errors: yes

    - name: "Fallback to clean reinstall"
      include_tasks: "recovery/clean_reinstall.yml"
      when: recovery_failed | default(false)
```

**タスク:**
- [ ] エラーハンドリングの標準化
- [ ] 復旧スクリプトの作成
- [ ] ロールバック機能の実装

### Priority 2: Security and Compliance (重要度: 高)

#### 2.1 Security Hardening
**目的:** セキュリティベストプラクティスの実装

**実装:**
```yaml
# roles/security/tasks/main.yml
- name: Configure system security settings
  include_tasks: "{{ item }}"
  with_items:
    - firewall.yml
    - auditd.yml
    - apparmor.yml
    - fail2ban.yml
```

**タスク:**
- [ ] 専用セキュリティロールの作成
- [ ] ファイアウォール設定の自動化
- [ ] 監査ログの強化
- [ ] セキュリティスキャンの統合

#### 2.2 Secrets Management
**目的:** 機密情報の安全な管理

**実装:**
```yaml
# Using Doppler for secret management
- name: Retrieve secrets from Doppler
  uri:
    url: "https://api.doppler.com/v3/configs/config/secrets"
    headers:
      Authorization: "Bearer {{ doppler_token }}"
```

**タスク:**
- [ ] Doppler統合の実装
- [ ] 平文パスワードの排除
- [ ] 環境別シークレット管理

### Priority 3: Performance and Scalability (重要度: 中)

#### 3.1 Parallel Installation
**目的:** インストール時間の短縮

**実装:**
```yaml
# site.yml with async tasks
- name: Install tools in parallel
  include_role:
    name: "{{ item }}"
  async: 3600
  poll: 0
  loop: "{{ parallel_roles }}"
  register: parallel_jobs
```

**タスク:**
- [ ] 並列実行可能ロールの特定
- [ ] 非同期タスクの実装
- [ ] リソース競合の回避

#### 3.2 Cache and Optimization
**目的:** ダウンロード・インストールの最適化

**実装:**
```yaml
# Local package cache
- name: Setup local package cache
  file:
    path: "{{ cache_dir }}/{{ item }}"
    state: directory
  loop:
    - apt
    - downloads
    - builds
```

**タスク:**
- [ ] ローカルキャッシュの実装
- [ ] 差分インストールの最適化
- [ ] ネットワーク使用量の削減

### Priority 4: Monitoring and Observability (重要度: 中)

#### 4.1 Installation Monitoring
**目的:** インストール状況の可視化

**実装:**
```yaml
# roles/monitoring/tasks/main.yml
- name: Setup installation monitoring
  template:
    src: monitoring-config.j2
    dest: /etc/ansible-monitor.conf
```

**タスク:**
- [ ] インストール進捗の追跡
- [ ] エラー率の監視
- [ ] パフォーマンス指標の収集

#### 4.2 Health Checks
**目的:** システム状態の継続的監視

**実装:**
```yaml
# healthcheck.yml
- name: System health check
  include_tasks: "roles/{{ item }}/tasks/healthcheck.yml"
  loop: "{{ installed_roles }}"
```

**タスク:**
- [ ] 定期ヘルスチェックの実装
- [ ] 異常検知・アラート機能
- [ ] 自動修復機能

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ ディレクトリ構造の整理
2. 🔄 ロール依存関係の定義
3. 🔄 基本的なバリデーション機能

### Phase 2: Security (Week 3-4)
1. 🔄 セキュリティロールの実装
2. 🔄 シークレット管理の改善
3. 🔄 監査機能の強化

### Phase 3: Performance (Week 5-6)
1. 🔄 並列処理の実装
2. 🔄 キャッシュ機能の追加
3. 🔄 最適化の実施

### Phase 4: Monitoring (Week 7-8)
1. 🔄 監視機能の実装
2. 🔄 ヘルスチェックの自動化
3. 🔄 ダッシュボードの作成

## Success Metrics

### Performance Metrics
- **インストール時間**: 50%短縮目標
- **エラー率**: 5%以下
- **再実行成功率**: 99%以上

### Security Metrics
- **脆弱性**: ゼロ維持
- **セキュリティスコア**: 95%以上
- **コンプライアンス**: 100%準拠

### Operational Metrics
- **自動化率**: 95%以上
- **手動介入**: 月1回以下
- **復旧時間**: 30分以内

## Risk Assessment

### High Risk
- **ロール依存関係の変更**: 既存環境への影響
- **セキュリティ設定の変更**: アクセス制限の可能性

### Medium Risk
- **並列処理の実装**: リソース競合のリスク
- **監視機能の追加**: パフォーマンスへの影響

### Mitigation Strategies
- 段階的リリース
- バックアップ・ロールバック計画
- 充分なテスト期間

## Next Steps

1. **Phase 1開始**: ロール依存関係の定義から着手
2. **テスト環境**: 専用テスト環境での検証
3. **チームレビュー**: 各フェーズでのレビュー実施
4. **本番適用**: 段階的な本番環境への適用

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-16  
**Author**: Claude Code  
**Review Cycle**: 月次
