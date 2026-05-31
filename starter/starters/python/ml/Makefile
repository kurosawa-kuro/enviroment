.PHONY: help train test clean

help:
	@echo "Targets:"
	@echo "  train  Run local LightGBM training pipeline"
	@echo "  test   Run unit tests"
	@echo "  clean  Remove local generated artifacts"

train:
	PYTHONPATH=src python3 -m housing_ml.cli

test:
	PYTHONPATH=src python3 -m unittest discover -s tests

clean:
	rm -rf artifacts/*
	touch artifacts/.gitkeep
