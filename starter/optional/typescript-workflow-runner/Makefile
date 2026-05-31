.PHONY: install build dev start clean test test-watch hello-world db-init item-crud doppler-setup doppler-check doppler-secrets doppler-run pm2-start pm2-stop pm2-status pm2-logs help

# Default target
help:
	@echo "Available targets:"
	@echo "  install         - Install dependencies"
	@echo "  build           - Build TypeScript to JavaScript"
	@echo "  dev             - Run workflow with hot reload (development)"
	@echo "  start           - Run workflow"
	@echo "  hello-world     - Run hello-world step"
	@echo "  db-init         - Run db-init step"
	@echo "  item-crud       - Run item-crud step"
	@echo "  test            - Run tests"
	@echo "  test-watch      - Run tests in watch mode"
	@echo "  clean           - Remove build artifacts"
	@echo ""
	@echo "Doppler:"
	@echo "  doppler-setup   - Setup Doppler project/config"
	@echo "  doppler-check   - Check Doppler configuration"
	@echo "  doppler-secrets - List Doppler secrets (names only)"
	@echo "  doppler-run     - Run with Doppler secrets"
	@echo ""
	@echo "PM2 targets:"
	@echo "  pm2-start       - Start workflow with PM2"
	@echo "  pm2-stop        - Stop all PM2 processes"
	@echo "  pm2-status      - Show PM2 process status"
	@echo "  pm2-logs        - Show PM2 logs"

# Install dependencies
install:
	npm install

# Build TypeScript
build:
	npm run build

# Development with hot reload
dev:
	npm run dev

# Run production build
start:
	npm start

# Run hello-world step
hello-world:
	npm run hello-world

# Run db-init step
db-init:
	npm run db-init

# Run item-crud step
item-crud:
	npm run item-crud

# Run tests
test:
	npm test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules

# Doppler setup - Configure project and config
doppler-setup:
	doppler configure set project <doppler-project> && doppler configure set config dev

# Doppler check - Show current configuration
doppler-check:
	doppler configure

# Doppler secrets - List secret names only
doppler-secrets:
	doppler secrets --only-names

# Run with Doppler secrets
doppler-run:
	doppler run -- npm start

# ============================================================================
# PM2 Commands
# ============================================================================

# Start workflow with PM2
pm2-start:
	pm2 start ecosystem.config.cjs

# Start specific job with PM2
# Usage: make pm2-start-job JOB=item-crud
pm2-start-job:
	pm2 start ecosystem.config.cjs --only $(JOB)

# Stop all PM2 processes
pm2-stop:
	pm2 stop ecosystem.config.cjs

# Delete all PM2 processes
pm2-delete:
	pm2 delete ecosystem.config.cjs

# Show PM2 status
pm2-status:
	pm2 status

# Show PM2 logs
pm2-logs:
	pm2 logs

# Restart workflow with PM2
pm2-restart:
	pm2 restart ecosystem.config.cjs

# Start with Doppler + PM2
pm2-doppler:
	doppler run -- pm2 start ecosystem.config.cjs
