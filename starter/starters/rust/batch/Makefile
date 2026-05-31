.PHONY: build run clean test release fmt clippy check dev
.PHONY: hello-world db-init item-crud list

# ============================================================================
# Build & Run
# ============================================================================

build:
	cargo build

release:
	cargo build --release

run:
	cargo run

dev:
	cargo watch -x run

clean:
	cargo clean
	rm -rf data/

# ============================================================================
# Testing & Quality
# ============================================================================

test:
	cargo test

test-verbose:
	cargo test -- --nocapture

fmt:
	cargo fmt

clippy:
	cargo clippy -- -D warnings

check: fmt clippy test
	@echo "All checks passed!"

# ============================================================================
# Job Targets
# ============================================================================

list:
	cargo run -- --list

hello-world:
	cargo run -- --job hello-world

db-init:
	cargo run -- --job db-init

item-crud:
	cargo run -- --job item-crud

# ============================================================================
# Development Utilities
# ============================================================================

# Install development dependencies
deps:
	cargo fetch
	@echo "Consider installing cargo-watch for hot reload:"
	@echo "  cargo install cargo-watch"

# Run with specific log level
run-debug:
	LOG_LEVEL=debug cargo run

run-trace:
	LOG_LEVEL=trace cargo run

# Database utilities
db-reset:
	rm -f data/batch.db data/batch.db-wal data/batch.db-shm
	$(MAKE) db-init

# ============================================================================
# Help
# ============================================================================

help:
	@echo "Batch Workflow Runner - Makefile Commands"
	@echo ""
	@echo "Build & Run:"
	@echo "  make build      - Build debug binary"
	@echo "  make release    - Build release binary"
	@echo "  make run        - Run all workflow steps"
	@echo "  make dev        - Run with hot reload (requires cargo-watch)"
	@echo "  make clean      - Clean build artifacts and data"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test       - Run all tests"
	@echo "  make fmt        - Format code"
	@echo "  make clippy     - Run linter"
	@echo "  make check      - Run fmt, clippy, and test"
	@echo ""
	@echo "Job Targets:"
	@echo "  make list       - List available jobs"
	@echo "  make hello-world - Run hello-world job"
	@echo "  make db-init    - Initialize database"
	@echo "  make item-crud  - Run item CRUD demo"
	@echo ""
	@echo "Utilities:"
	@echo "  make deps       - Fetch dependencies"
	@echo "  make db-reset   - Reset database and reinitialize"
	@echo "  make help       - Show this help"
