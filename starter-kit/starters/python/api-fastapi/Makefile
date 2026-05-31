.PHONY: help install run test e2e clean

help:
	@echo "Targets:"
	@echo "  install  Install Python dependencies"
	@echo "  run      Start FastAPI app on localhost:8000"
	@echo "  test     Run unit tests"
	@echo "  e2e      Run e2e tests"
	@echo "  clean    Remove local runtime artifacts"

install:
	pip install -r requirements.txt

run:
	PYTHONPATH=src uvicorn micropost_api.main:app --reload --host 127.0.0.1 --port 8000

test:
	PYTHONPATH=src python3 -m pytest tests

e2e:
	PYTHONPATH=src python3 -m pytest e2e

clean:
	rm -rf src/micropost_api/__pycache__ src/micropost_api/web/__pycache__
	rm -rf tests/__pycache__ e2e/__pycache__ .pytest_cache
	rm -f microposts.db
