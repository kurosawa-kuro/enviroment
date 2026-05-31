from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import lightgbm as lgb
import pandas as pd

from housing_ml.constants import DATASET_NAME, MODEL_NAME
from housing_ml.data.load import load_bronze_dataset
from housing_ml.data.split import split_train_valid_test
from housing_ml.data.validate import validate_silver_dataset
from housing_ml.evaluation.explain import build_feature_importance
from housing_ml.evaluation.metrics import evaluate_regression
from housing_ml.features.build import build_gold_features
from housing_ml.infra.bigquery import log_metrics_to_bigquery
from housing_ml.infra.gcs import GcsPrefix, upload_directory
from housing_ml.registry.artifacts import save_model_artifacts
from housing_ml.registry.manifest import (
    build_run_manifest,
    new_run_id,
    write_run_manifest,
)
from housing_ml.training.train_lightgbm import train_lightgbm_model


@dataclass(frozen=True)
class TrainingConfig:
    output_dir: Path
    seed: int = 42
    gcs_prefix: str | None = None
    bq_metrics_table: str | None = None
    run_id: str | None = None


@dataclass(frozen=True)
class TrainingResult:
    model: lgb.Booster
    metrics: dict[str, float | int]
    feature_importance: pd.DataFrame
    output_dir: Path
    manifest_path: Path
    run_id: str
    artifact_uri: str | None


def run_training_pipeline(config: TrainingConfig) -> TrainingResult:
    raw_dataset = load_bronze_dataset()
    validate_silver_dataset(raw_dataset)
    feature_table = build_gold_features(raw_dataset)
    split = split_train_valid_test(
        feature_table.features,
        feature_table.target,
        seed=config.seed,
    )

    model = train_lightgbm_model(split, seed=config.seed)
    metrics = evaluate_regression(model, split.X_test, split.y_test)
    importance = build_feature_importance(model, feature_table.schema.columns)

    resolved_run_id = config.run_id or new_run_id()
    artifact_uri = (
        GcsPrefix.parse(config.gcs_prefix).child(resolved_run_id).uri()
        if config.gcs_prefix
        else None
    )

    save_model_artifacts(
        output_dir=config.output_dir,
        model=model,
        metrics=metrics,
        feature_importance=importance,
    )
    manifest = build_run_manifest(
        run_id=resolved_run_id,
        model_name=MODEL_NAME,
        dataset_name=DATASET_NAME,
        seed=config.seed,
        metrics=metrics,
        artifact_uri=artifact_uri,
        feature_columns=feature_table.schema.columns,
        feature_dtypes=feature_table.schema.dtypes,
    )
    manifest_path = write_run_manifest(config.output_dir, manifest)

    if config.gcs_prefix:
        destination = GcsPrefix.parse(config.gcs_prefix).child(resolved_run_id)
        uploaded = upload_directory(config.output_dir, destination)
        print(f"\nUploaded {len(uploaded)} artifact(s) to {destination.uri()}")

    if config.bq_metrics_table:
        log_metrics_to_bigquery(
            table=config.bq_metrics_table,
            run_id=resolved_run_id,
            metrics=metrics,
            model_name=MODEL_NAME,
            dataset=DATASET_NAME,
            seed=config.seed,
            artifact_uri=artifact_uri,
        )
        print(f"Logged metrics to BigQuery table {config.bq_metrics_table}")

    return TrainingResult(
        model=model,
        metrics=metrics,
        feature_importance=importance,
        output_dir=config.output_dir,
        manifest_path=manifest_path,
        run_id=resolved_run_id,
        artifact_uri=artifact_uri,
    )
