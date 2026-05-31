from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.datasets import fetch_california_housing

from housing_ml.constants import DATASET_NAME


@dataclass(frozen=True)
class RawDataset:
    """Bronze layer: source data as loaded from sklearn."""

    features: pd.DataFrame
    target: pd.Series
    feature_names: list[str]
    dataset_name: str = DATASET_NAME


def load_bronze_dataset() -> RawDataset:
    dataset = fetch_california_housing(as_frame=True)
    return RawDataset(
        features=dataset.data,
        target=dataset.target,
        feature_names=list(dataset.feature_names),
    )
