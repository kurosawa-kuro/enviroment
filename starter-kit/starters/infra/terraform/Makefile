# ============================================================
# Terraform (IaC) - Makefile
# ============================================================
# ENV で環境を切り替える (既定: dev)。 例: make plan ENV=prod
ENV ?= dev
TFVARS = environments/$(ENV).tfvars

.PHONY: help init check-tfvars plan apply destroy fmt validate clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## terraform init
	terraform init

check-tfvars:
	@if [ ! -f "$(TFVARS)" ]; then \
		echo "Missing $(TFVARS)."; \
		echo "Create it from the sample before running this command:"; \
		echo "  cp environments/$(ENV).tfvars.example $(TFVARS)"; \
		exit 1; \
	fi

plan: check-tfvars ## terraform plan (ENV=dev|prod)
	terraform plan -var-file=$(TFVARS)

apply: check-tfvars ## terraform apply (ENV=dev|prod)
	terraform apply -var-file=$(TFVARS)

destroy: check-tfvars ## terraform destroy (ENV=dev|prod)
	terraform destroy -var-file=$(TFVARS)

fmt: ## Format .tf files
	terraform fmt -recursive

validate: ## Validate configuration
	terraform validate

clean: ## Remove local terraform state cache
	rm -rf .terraform .terraform.lock.hcl
