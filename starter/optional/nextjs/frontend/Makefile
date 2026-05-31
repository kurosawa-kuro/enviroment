# Next.js Frontend Makefile

.PHONY: help clean build dev start lint install kill-port check env-setup

# Default target
help:
	@echo "Next.js Frontend - Available commands:"
	@echo "  install    - Install npm dependencies"
	@echo "  dev        - Start development server with Turbopack"
	@echo "  build      - Build for production"
	@echo "  start      - Start production server"
	@echo "  lint       - Run ESLint"
	@echo "  clean      - Clean build artifacts"
	@echo "  kill-port  - Kill process on port 3000"
	@echo "  env-setup  - Copy .env.sample to .env.local"
	@echo "  check      - Run lint and build"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Start development server
dev:
	@echo "Starting development server with Turbopack..."
	npm run dev

# Build for production
build:
	@echo "Building for production..."
	npm run build

# Start production server
start:
	@echo "Starting production server..."
	npm run start

# Run ESLint
lint:
	@echo "Running ESLint..."
	npm run lint

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .next
	rm -rf out
	rm -rf node_modules/.cache

# Kill process on port 3000
kill-port:
	@echo "Killing process on port 3000..."
	@./script/kill-frontend-port.sh || true

# Setup environment file
env-setup:
	@echo "Setting up environment file..."
	@if [ ! -f .env.local ]; then \
		cp .env.sample .env.local; \
		echo ".env.local created from .env.sample"; \
	else \
		echo ".env.local already exists"; \
	fi

# Run all checks
check: lint build
	@echo "All checks completed successfully!"

# Show project info
info:
	@echo "Project: Next.js Frontend"
	@echo "Next.js Version: 15.x"
	@echo "React Version: 19.x"
	@echo "Port: 3000"
	@echo "Dev URL: http://localhost:3000"
