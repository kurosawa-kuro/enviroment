DB_VERSION=14
DB_PASSWORD=yourpassword
DB_USER=postgres

# Local DB
DB_LOCAL_CONTAINER=pg-local
DB_LOCAL_NAME=dev_local
DB_LOCAL_PORT=5433
DB_LOCAL_VOLUME=./pgdata-local

# Test DB
DB_TEST_CONTAINER=pg-test
DB_TEST_NAME=dev_test
DB_TEST_PORT=5434
DB_TEST_VOLUME=./pgdata-test

# DWH DB
DB_DWH_CONTAINER=pg-dwh
DB_DWH_NAME=dev_dwh
DB_DWH_PORT=5435
DB_DWH_VOLUME=./pgdata-dwh
DB_DWH_IMAGE=postgres-dwh:13

# ポート使用チェック
check-port-5432:
	@if lsof -i :$(DB_LOCAL_PORT) > /dev/null; then \
		echo "❌ Port $(DB_LOCAL_PORT) is already in use. Stop the existing process before proceeding."; \
		exit 1; \
	fi

check-port-5433:
	@if lsof -i :$(DB_TEST_PORT) > /dev/null; then \
		echo "❌ Port $(DB_TEST_PORT) is already in use. Stop the existing process before proceeding."; \
		exit 1; \
	fi

check-port-5434:
	@if lsof -i :$(DB_DWH_PORT) > /dev/null; then \
		echo "❌ Port $(DB_DWH_PORT) is already in use. Stop the existing process before proceeding."; \
		exit 1; \
	fi

# DB起動（個別）
start-db-local: check-port-5432
	@if [ $$(docker ps -aq -f name=$(DB_LOCAL_CONTAINER)) ]; then \
		echo "⚠️  $(DB_LOCAL_CONTAINER) exists. Removing..."; \
		docker stop $(DB_LOCAL_CONTAINER) || true; \
		docker rm $(DB_LOCAL_CONTAINER); \
	fi
	docker run -d \
		--name $(DB_LOCAL_CONTAINER) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-e POSTGRES_DB=$(DB_LOCAL_NAME) \
		-v $(DB_LOCAL_VOLUME):/var/lib/postgresql/data \
		-p $(DB_LOCAL_PORT):5432 \
		postgres:$(DB_VERSION)

start-db-test: check-port-5433
	@if [ $$(docker ps -aq -f name=$(DB_TEST_CONTAINER)) ]; then \
		echo "⚠️  $(DB_TEST_CONTAINER) exists. Removing..."; \
		docker stop $(DB_TEST_CONTAINER) || true; \
		docker rm $(DB_TEST_CONTAINER); \
	fi
	docker run -d \
		--name $(DB_TEST_CONTAINER) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-e POSTGRES_DB=$(DB_TEST_NAME) \
		-e NODE_ENV=test \
		-v $(DB_TEST_VOLUME):/var/lib/postgresql/data \
		-p $(DB_TEST_PORT):5432 \
		postgres:$(DB_VERSION)

# DWHビルド
build-db-dwh:
	docker build -t $(DB_DWH_IMAGE) ./docker/postgres-dwh

# DWH起動（拡張・initスクリプト含む）
start-db-dwh: check-port-5434 build-db-dwh
	@if [ $$(docker ps -aq -f name=$(DB_DWH_CONTAINER)) ]; then \
		echo "⚠️  $(DB_DWH_CONTAINER) exists. Removing..."; \
		docker stop $(DB_DWH_CONTAINER) || true; \
		docker rm $(DB_DWH_CONTAINER); \
	fi
	docker run -d \
		--name $(DB_DWH_CONTAINER) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-e POSTGRES_DB=$(DB_DWH_NAME) \
		-v $(DB_DWH_VOLUME):/var/lib/postgresql/data \
		-v $(PWD)/dwh/init.sql:/docker-entrypoint-initdb.d/init.sql \
		-p $(DB_DWH_PORT):5432 \
		$(DB_DWH_IMAGE)

# 一括起動
start-db:
	make start-db-local && make start-db-test && make start-db-dwh

# 一括停止
stop-db:
	docker stop $(DB_LOCAL_CONTAINER) || true
	docker stop $(DB_TEST_CONTAINER) || true
	docker stop $(DB_DWH_CONTAINER) || true
