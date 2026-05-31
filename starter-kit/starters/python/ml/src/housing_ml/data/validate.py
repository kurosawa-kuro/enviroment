from __future__ import annotations

from housing_ml.data.load import RawDataset


def validate_silver_dataset(dataset: RawDataset) -> None:
    """Silver layer: fail fast before feature building."""
    if dataset.features.empty:
        raise ValueError("features must not be empty")
    if dataset.target.empty:
        raise ValueError("target must not be empty")
    if len(dataset.features) != len(dataset.target):
        raise ValueError("features and target length mismatch")
    if dataset.features.isna().any().any():
        raise ValueError("features contain null values")
    if dataset.target.isna().any():
        raise ValueError("target contains null values")
    missing = set(dataset.feature_names) - set(dataset.features.columns)
    if missing:
        raise ValueError(f"feature columns missing: {sorted(missing)}")
