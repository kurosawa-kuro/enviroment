from __future__ import annotations

import argparse
from pathlib import Path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Train LightGBM on California housing with artifact and metrics tracking."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "artifacts",
        help="Directory to save the trained model, metrics, feature importance, and manifest.",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--gcs-prefix",
        help="Upload registry-ready artifacts under this GCS prefix.",
    )
    parser.add_argument(
        "--bq-metrics-table",
        help="BigQuery table for model metrics mart (project.dataset.table).",
    )
    parser.add_argument(
        "--run-id",
        help="Custom run id (default: timestamp-uuid).",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    from housing_ml.pipelines.train_pipeline import (
        TrainingConfig,
        run_training_pipeline,
    )

    result = run_training_pipeline(
        TrainingConfig(
            output_dir=args.output_dir,
            seed=args.seed,
            gcs_prefix=args.gcs_prefix,
            bq_metrics_table=args.bq_metrics_table,
            run_id=args.run_id,
        )
    )

    print("\n=== Test metrics ===")
    for name, value in result.metrics.items():
        print(f"{name}: {value}")
    print("\n=== Feature importance (gain) ===")
    print(result.feature_importance.to_string(index=False))
    print(f"\nArtifacts saved to: {result.output_dir.resolve()}")
    print(f"Run id: {result.run_id}")
    if result.artifact_uri:
        print(f"Artifact URI: {result.artifact_uri}")


if __name__ == "__main__":
    main()
