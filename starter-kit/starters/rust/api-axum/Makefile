.PHONY: build build-prod run dev test test-coverage clean fmt deps docker docker-bg docker-down

# Application
APP_NAME := hello-world-api
PORT ?= 8080

# Build
build:
	cargo build

build-prod:
	cargo build --release

# Run
run:
	PORT=$(PORT) cargo run

dev:
	PORT=$(PORT) cargo watch -x run

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

# Clean
clean:
	cargo clean
	rm -rf coverage

# Docker
docker:
	docker compose -f docker/docker-compose.yml up --build

docker-bg:
	docker compose -f docker/docker-compose.yml up --build -d

docker-down:
	docker compose -f docker/docker-compose.yml down
