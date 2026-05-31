from __future__ import annotations

import lightgbm as lgb

from housing_ml.data.split import DatasetSplit
from housing_ml.training.params import default_lightgbm_params


def train_lightgbm_model(
    split: DatasetSplit,
    *,
    seed: int,
    num_boost_round: int = 2000,
    early_stopping_rounds: int = 50,
) -> lgb.Booster:
    train_set = lgb.Dataset(split.X_train, label=split.y_train)
    valid_set = lgb.Dataset(split.X_valid, label=split.y_valid, reference=train_set)

    return lgb.train(
        default_lightgbm_params(seed),
        train_set,
        num_boost_round=num_boost_round,
        valid_sets=[train_set, valid_set],
        valid_names=["train", "valid"],
        callbacks=[
            lgb.early_stopping(stopping_rounds=early_stopping_rounds),
            lgb.log_evaluation(period=100),
        ],
    )
