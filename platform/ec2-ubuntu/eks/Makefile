# =============================================================================
# EKS 統合管理 Makefile
# =============================================================================

.PHONY: help infrastructure applications kubernetes scripts clean

# =============================================================================
# ヘルプ
# =============================================================================
help:
	@echo "EKS プロジェクト統合管理コマンド:"
	@echo ""
	@echo "インフラストラクチャ:"
	@echo "  make infra-deploy    - EKSクラスターをデプロイ"
	@echo "  make infra-status    - インフラストラクチャの状態確認"
	@echo "  make infra-destroy   - EKSクラスターを削除"
	@echo ""
	@echo "アプリケーション:"
	@echo "  make app-build       - 全アプリケーションをビルド"
	@echo "  make app-deploy      - アプリケーションをKubernetesにデプロイ"
	@echo "  make app-logs        - アプリケーションログを表示"
	@echo ""
	@echo "Kubernetes管理:"
	@echo "  make k8s-apply-dev   - 開発環境にデプロイ"
	@echo "  make k8s-apply-prod  - 本番環境にデプロイ"
	@echo "  make k8s-status      - Kubernetesリソース状態確認"
	@echo "  make k8s-clean       - Kubernetesリソースをクリーンアップ"
	@echo ""
	@echo "運用:"
	@echo "  make connect         - バスティオンホストに接続"
	@echo "  make setup-tools     - 必要なツールをセットアップ"
	@echo "  make test            - テスト実行"
	@echo ""
	@echo "その他:"
	@echo "  make clean           - 一時ファイルをクリーンアップ"
	@echo "  make validate        - 設定ファイルを検証"

# =============================================================================
# インフラストラクチャ管理
# =============================================================================
infra-deploy:
	@echo "EKSクラスターをデプロイ中..."
	cd infrastructure/cloudformation && $(MAKE) deploy

infra-status:
	@echo "インフラストラクチャ状態を確認中..."
	cd infrastructure/cloudformation && $(MAKE) status

infra-destroy:
	@echo "EKSクラスターを削除中..."
	cd infrastructure/cloudformation && $(MAKE) destroy

# =============================================================================
# アプリケーション管理
# =============================================================================
app-build:
	@echo "全アプリケーションをビルド中..."
	cd applications/backend && $(MAKE) build || echo "Backend build not available"
	cd applications/frontend && $(MAKE) build || echo "Frontend build not available"

app-deploy:
	@echo "アプリケーションをデプロイ中..."
	kubectl apply -f infrastructure/kubernetes/base/

app-logs:
	@echo "アプリケーションログを表示..."
	kubectl logs -f deployment/backend-deployment --tail=50 || echo "Backend deployment not found"
	kubectl logs -f deployment/frontend-deployment --tail=50 || echo "Frontend deployment not found"

# =============================================================================
# Kubernetes管理
# =============================================================================
k8s-apply-dev:
	@echo "開発環境にデプロイ中..."
	kubectl apply -k infrastructure/kubernetes/overlays/dev/

k8s-apply-prod:
	@echo "本番環境にデプロイ中..."
	kubectl apply -k infrastructure/kubernetes/overlays/prod/

k8s-status:
	@echo "Kubernetesリソース状態:"
	kubectl get nodes
	kubectl get pods --all-namespaces
	kubectl get services

k8s-clean:
	@echo "Kubernetesリソースをクリーンアップ中..."
	kubectl delete -f infrastructure/kubernetes/base/ || echo "No resources to delete"

# =============================================================================
# 運用管理
# =============================================================================
connect:
	@echo "バスティオンホストに接続中..."
	scripts/management/start_session_bastion.sh

setup-tools:
	@echo "必要なツールをセットアップ中..."
	scripts/setup/setup-kubectl-argocd.sh

test:
	@echo "テストを実行中..."
	cd tests && echo "テスト機能は未実装です"

# =============================================================================
# ユーティリティ
# =============================================================================
validate:
	@echo "設定ファイルを検証中..."
	cd infrastructure/cloudformation && aws cloudformation validate-template --template-body file://templates/eks-platform.yaml

clean:
	@echo "一時ファイルをクリーンアップ中..."
	find . -name "*.tmp" -delete
	find . -name "*.log" -delete
	docker system prune -f || echo "Docker not available"

# =============================================================================
# 開発用ショートカット
# =============================================================================
dev-setup: infra-deploy setup-tools k8s-apply-dev
	@echo "開発環境セットアップ完了!"

full-deploy: infra-deploy app-build app-deploy
	@echo "フルデプロイ完了!"

quick-update: app-build app-deploy
	@echo "アプリケーション更新完了!"