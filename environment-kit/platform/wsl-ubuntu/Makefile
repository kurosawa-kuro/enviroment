# =============================================================================
# WSL Ubuntu Environment Setup Makefile
# =============================================================================
# このMakefileはWSL Ubuntu環境のセットアップと管理を行います
# 
# 使用方法:
#   make setup-ansible    # Ansible環境の初期セットアップ
#   make setup           # config.ymlベースの環境セットアップ
#   make test            # syntax + lint + check
#   make check           # システム状態確認
#   make help            # ヘルプ表示
# =============================================================================

.PHONY: setup-ansible setup setup-base setup-user setup-rust version syntax lint test test-base test-rust check check-system molecule-install molecule-list molecule-test molecule-test-base molecule-test-user molecule-test-all cleanup-temp generate-requirements help

# =============================================================================
# 設定変数
# =============================================================================

# 基本パス設定
ROOT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
ANSIBLE_DIR := $(ROOT_DIR)/ansible
SCRIPT_DIR := $(ROOT_DIR)/script
MOLECULE_VENV := $(ROOT_DIR)/.venv-molecule
MOLECULE_BIN := $(MOLECULE_VENV)/bin/molecule

# Ansible設定
PLAYBOOK := $(ANSIBLE_DIR)/site.yml
PLAYBOOK_CUSTOM := $(ANSIBLE_DIR)/site-selective.yml
PLAYBOOK_BASE := $(ANSIBLE_DIR)/site-base.yml
PLAYBOOK_USER := $(ANSIBLE_DIR)/site-user.yml
PLAYBOOK_RUST := $(ANSIBLE_DIR)/site-rust.yml
PLAYBOOK_CHECK := $(ANSIBLE_DIR)/site-check.yml
INVENTORY := $(ANSIBLE_DIR)/inventory/hosts
ANSIBLE_CONFIG := $(ANSIBLE_DIR)/ansible.cfg

# システム設定
LOG_DIR := /var/log/ansible
USER := $(shell whoami)
TEMP_DIRS := /home/wsl/.ansible-temp /tmp/.ansible-cp

# =============================================================================
# 初期セットアップ
# =============================================================================

# Ansible環境の初期セットアップ
setup-ansible:
	@echo "🚀 Ansible環境の初期セットアップを開始します..."
	@if [ ! -f "$(SCRIPT_DIR)/setup-ansible.sh" ]; then \
		echo "❌ セットアップスクリプトが見つかりません: $(SCRIPT_DIR)/setup-ansible.sh"; \
		exit 1; \
	fi
	@chmod +x "$(SCRIPT_DIR)/setup-ansible.sh"
	@$(SCRIPT_DIR)/setup-ansible.sh
	@echo "✅ Ansible環境の初期セットアップが完了しました"

# =============================================================================
# メインセットアップ
# =============================================================================

# 環境セットアップ（config.ymlの設定に基づく）
setup:
	@echo "🎯 環境セットアップを開始します（config.ymlの設定に基づく）..."
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_CUSTOM) -i $(INVENTORY)
	@echo "✅ 環境セットアップが完了しました"

# WSL基盤セットアップ
setup-base:
	@echo "🧱 WSL基盤セットアップを開始します..."
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_BASE) -i $(INVENTORY)
	@echo "✅ WSL基盤セットアップが完了しました"

# ユーザー初期化（opt-in）
setup-user:
	@echo "👤 ユーザー初期化を開始します..."
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_USER) -i $(INVENTORY)
	@echo "✅ ユーザー初期化が完了しました"

# Rust単体セットアップ（site-selective.yml の既存不備に影響されない導線）
setup-rust:
	@echo "🦀 Rust単体セットアップを開始します..."
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_RUST) -i $(INVENTORY)
	@echo "✅ Rust単体セットアップが完了しました"

# =============================================================================
# テスト・検証
# =============================================================================

# Ansibleバージョン確認
version:
	@echo "📋 Ansibleバージョン情報:"
	@ansible --version || echo "❌ Ansibleがインストールされていません"

# メインプレイブックの構文チェック
syntax:
	@echo "🧪 メインプレイブックの構文チェックを開始します..."
	@ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK) -i $(INVENTORY) --syntax-check
	@echo "=== メインプレイブックの構文チェック完了 ==="

# Ansible静的検査
lint:
	@echo "🧪 Ansible lint を実行します..."
	@command -v ansible-lint >/dev/null 2>&1 || (echo "❌ ansible-lint がインストールされていません"; exit 1)
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-lint .
	@echo "=== Ansible lint 完了 ==="

# テスト統合
test: syntax lint check
	@echo "=== Ansible テスト完了 ==="

# WSL基盤プレイブックの構文チェック
test-base:
	@echo "🧪 WSL基盤プレイブックの構文チェックを開始します..."
	@ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_BASE) -i $(INVENTORY) --syntax-check
	@echo "=== WSL基盤プレイブックの構文チェック完了 ==="

# Rust追加分だけを安全に検証するための構文チェック
test-rust:
	@echo "🧪 Rust単体プレイブックの構文チェックを開始します..."
	@ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_RUST) -i $(INVENTORY) --syntax-check
	@echo "=== Rust単体プレイブックの構文チェック完了 ==="

# 実行後の状態確認
check:
	@echo "🔍 Ansible状態確認を実行します..."
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook $(PLAYBOOK_CHECK) -i $(INVENTORY)
	@echo "✅ Ansible状態確認が完了しました"

# 既存のバージョン確認スクリプト
check-system:
	@echo "🔍 システム状態を確認します..."
	@if [ ! -f "$(SCRIPT_DIR)/check-system.sh" ]; then \
		echo "❌ システムチェックスクリプトが見つかりません: $(SCRIPT_DIR)/check-system.sh"; \
		exit 1; \
	fi
	@chmod +x "$(SCRIPT_DIR)/check-system.sh"
	@$(SCRIPT_DIR)/check-system.sh

# Molecule用仮想環境の準備
molecule-install:
	@echo "🧪 Molecule 環境をセットアップします..."
	@python3 -m venv $(MOLECULE_VENV)
	@$(MOLECULE_VENV)/bin/python -m pip install --upgrade pip
	@$(MOLECULE_VENV)/bin/python -m pip install -r $(ANSIBLE_DIR)/requirements-molecule.txt
	@PATH="$(MOLECULE_VENV)/bin:$$PATH" ansible-galaxy collection install -r $(ANSIBLE_DIR)/requirements-molecule.yml
	@echo "✅ Molecule 環境のセットアップが完了しました"

# Molecule シナリオ一覧
molecule-list: molecule-install
	@cd $(ANSIBLE_DIR) && PATH="$(MOLECULE_VENV)/bin:$$PATH" $(MOLECULE_BIN) list

# Molecule smoke 実行（既定は default）
molecule-test: molecule-install
	@cd $(ANSIBLE_DIR) && PATH="$(MOLECULE_VENV)/bin:$$PATH" $(MOLECULE_BIN) test -s $${SCENARIO:-default}

# Molecule base シナリオ実行
molecule-test-base: molecule-install
	@cd $(ANSIBLE_DIR) && PATH="$(MOLECULE_VENV)/bin:$$PATH" $(MOLECULE_BIN) test -s base

# Molecule user-bootstrap シナリオ実行
molecule-test-user: molecule-install
	@cd $(ANSIBLE_DIR) && PATH="$(MOLECULE_VENV)/bin:$$PATH" $(MOLECULE_BIN) test -s user-bootstrap

# Molecule 全シナリオ実行
molecule-test-all: molecule-install
	@cd $(ANSIBLE_DIR) && PATH="$(MOLECULE_VENV)/bin:$$PATH" $(MOLECULE_BIN) test --all

# =============================================================================
# メンテナンス
# =============================================================================

# 一時ファイルのクリーンアップ
cleanup-temp:
	@echo "🧹 Ansible一時ディレクトリをクリーンアップします..."
	@rm -rf $(TEMP_DIRS)
	@echo "✅ 一時ディレクトリのクリーンアップが完了しました"

# requirements.ymlの生成
generate-requirements:
	@echo "📝 requirements.ymlを生成します..."
	@if [ ! -f "$(ANSIBLE_DIR)/generate-requirements.yml" ]; then \
		echo "❌ 生成スクリプトが見つかりません: $(ANSIBLE_DIR)/generate-requirements.yml"; \
		exit 1; \
	fi
	@cd $(ANSIBLE_DIR) && ANSIBLE_CONFIG=$(ANSIBLE_CONFIG) ansible-playbook generate-requirements.yml
	@echo "✅ requirements.ymlの生成が完了しました"





# =============================================================================
# ヘルプ・ドキュメント
# =============================================================================

# ヘルプ表示
help:
	@echo "============================================================================="
	@echo "WSL Ubuntu Environment Setup Makefile"
	@echo "============================================================================="
	@echo ""
	@echo "📋 利用可能なターゲット:"
	@echo ""
	@echo "🚀 セットアップ:"
	@echo "  make setup-ansible        - Ansible環境の初期セットアップ"
	@echo "  make setup-base          - WSL基盤設定と基本ツールをセットアップ"
	@echo "  make setup-user          - Git / bashrc / .ssh のユーザー初期化"
	@echo "  make setup               - config.ymlの設定に基づく環境セットアップ"
	@echo "  make setup-rust          - Rustのみを個別セットアップ"
	@echo ""
	@echo "🧪 テスト・検証:"
	@echo "  make version             - Ansibleバージョン確認"
	@echo "  make syntax              - メインプレイブックの構文チェック"
	@echo "  make lint                - ansible-lint による静的検査"
	@echo "  make test                - syntax + lint + check"
	@echo "  make test-base           - WSL基盤プレイブックの構文チェック"
	@echo "  make test-rust           - Rust単体プレイブックの構文チェック"
	@echo "  make check               - Ansible の状態検証 playbook 実行"
	@echo "  make check-system        - 既存のシステム確認スクリプト実行"
	@echo "  make molecule-list       - Molecule シナリオ一覧"
	@echo "  make molecule-test       - Molecule default smoke 実行"
	@echo "  make molecule-test-base  - Molecule base シナリオ実行"
	@echo "  make molecule-test-user  - Molecule user-bootstrap シナリオ実行"
	@echo "  make molecule-test SCENARIO=runtime - 任意の Molecule シナリオ実行"
	@echo "  make molecule-test-all   - Molecule 全シナリオ実行"
	@echo ""
	@echo "🔧 メンテナンス:"
	@echo "  make cleanup-temp        - Ansible一時ディレクトリのクリーンアップ"
	@echo "  make generate-requirements - requirements.ymlの生成"
	@echo ""
	@echo "📖 ヘルプ:"
	@echo "  make help                - このヘルプメッセージを表示"
	@echo ""
	@echo "============================================================================="
	@echo "💡 WSL最小セットアップ導線: setup-ansible -> test-base -> setup-base"
	@echo "💡 opt-in の個人設定が必要な場合だけ setup-user を実行してください"
	@echo "💡 ヒント: 初回実行時は 'make setup-ansible' から開始してください"
	@echo "============================================================================="

# デフォルトターゲット
.DEFAULT_GOAL := help
