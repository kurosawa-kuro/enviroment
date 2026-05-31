# ============================================================
# Rust CLI - Makefile
# ============================================================

.PHONY: help setup build run test clean fmt clippy greet

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Install toolchain components and fetch dependencies
	rustup component add rustfmt clippy
	cargo fetch

build: ## Build the project (debug)
	cargo build

run: ## Run the CLI (use ARGS="..." to pass arguments)
	cargo run -- $(ARGS)

greet: ## Run the example greet subcommand
	cargo run -- greet

test: ## Run all tests
	cargo test

fmt: ## Format code
	cargo fmt

clippy: ## Lint with clippy
	cargo clippy -- -D warnings

clean: ## Remove build artifacts
	cargo clean
