.PHONY: help setup run seed clean test

PYTHON ?= python3

help:
	@echo "Available targets:"
	@echo "  setup  - Create .venv and install test dependencies"
	@echo "  run    - Run the sample batch"
	@echo "  seed   - Write sample input data"
	@echo "  test   - Run tests"
	@echo "  clean  - Remove generated files"

setup:
	$(PYTHON) -m venv .venv

run:
	$(PYTHON) -m src.main --input data/items.csv --output output/summary.json

seed:
	$(PYTHON) -m src.main seed --output data/items.csv

test:
	$(PYTHON) -m unittest discover -s tests

clean:
	rm -rf output .pytest_cache src/__pycache__ tests/__pycache__
