.PHONY: build build-prod run dev test test-coverage clean fmt deps setup db-setup db-reset db-seed frontend-install frontend-build e2e e2e-install e2e-setup e2e-headed e2e-report

# Application
APP_NAME := starter

# Setup
setup: db-setup frontend-install frontend-build build
	@echo "Setup complete."

# Database (default path from env/config.yaml: data/db.sqlite3)
DB_PATH ?= data/db.sqlite3

db-setup:
	@mkdir -p data
	@sqlite3 $(DB_PATH) "CREATE TABLE IF NOT EXISTS microposts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL);"
	@echo "Database initialized: $(DB_PATH)"

db-reset:
	@rm -f $(DB_PATH)
	@$(MAKE) db-setup
	@echo "Database reset."

db-seed: db-setup
	@sqlite3 $(DB_PATH) "INSERT INTO microposts (title) VALUES ('Hello World'), ('Welcome to Micropost'), ('Rust + SQLite');"
	@echo "Seed data inserted."

# Frontend
frontend-install:
	cd client && npm install

frontend-build:
	cd client && npm run build

# Build
build:
	cargo build

build-prod:
	cargo build --release

# Run (設定は env/config.yaml から読み込み、環境変数でオーバーライド可)
run:
	cargo run

dev:
	@-lsof -ti:8080 | xargs kill 2>/dev/null || true
	cargo watch -x run

# Test
test:
	cargo test -- --test-threads=1

test-coverage:
	cargo tarpaulin --out html --output-dir coverage

# Code Quality
fmt:
	cargo fmt

fmt-check:
	cargo fmt -- --check

lint:
	cargo clippy -- -D warnings

# Dependencies
deps:
	cargo update

# E2E Tests
e2e-install:
	cd e2e && npm install
	cd e2e && npx playwright install chromium

e2e-setup: frontend-build build e2e-install

e2e: e2e-setup
	cd e2e && npx playwright test

e2e-headed: e2e-setup
	cd e2e && npx playwright test --headed

e2e-report:
	cd e2e && npx playwright show-report

# Clean
clean:
	cargo clean
	rm -rf coverage
	rm -f $(DB_PATH)
	rm -rf client/dist
