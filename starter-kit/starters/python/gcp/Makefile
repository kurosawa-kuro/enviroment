.PHONY: help install seed list test clean

help:
	@echo "Targets:"
	@echo "  install  Install Python dependencies"
	@echo "  seed     Insert local sample data"
	@echo "  list     List local rows"
	@echo "  test     Show CLI help"
	@echo "  clean    Remove local runtime artifacts"

install:
	pip install -r requirements.txt

seed:
	PYTHONPATH=src python3 -m micropost_gcp.cli seed

list:
	PYTHONPATH=src python3 -m micropost_gcp.cli list

test:
	PYTHONPATH=src python3 -m py_compile $$(find src -name '*.py' | sort)

clean:
	rm -rf src/micropost_gcp/__pycache__ src/micropost_gcp/exporters/__pycache__
	rm -rf .pytest_cache
	rm -f microposts.db *.ndjson
