from __future__ import annotations

import socket
from datetime import datetime, timezone


METRICS_SCHEMA = [
    {"name": "run_id", "type": "STRING", "mode": "REQUIRED"},
    {"name": "logged_at", "type": "TIMESTAMP", "mode": "REQUIRED"},
    {"name": "model", "type": "STRING", "mode": "REQUIRED"},
    {"name": "dataset", "type": "STRING", "mode": "NULLABLE"},
    {"name": "seed", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "rmse", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "mae", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "r2", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "best_iteration", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "artifact_uri", "type": "STRING", "mode": "NULLABLE"},
    {"name": "host", "type": "STRING", "mode": "NULLABLE"},
]


def log_metrics_to_bigquery(
    *,
    table: str,
    run_id: str,
    metrics: dict,
    model_name: str,
    dataset: str | None,
    seed: int | None,
    artifact_uri: str | None,
) -> None:
    from google.cloud import bigquery  # type: ignore

    parts = table.split(".")
    if len(parts) != 3:
        raise ValueError(f"table must be project.dataset.table: {table!r}")

    client = bigquery.Client(project=parts[0])
    table_ref = bigquery.Table(
        table, schema=[bigquery.SchemaField(**field) for field in METRICS_SCHEMA]
    )
    client.create_table(table_ref, exists_ok=True)

    row = {
        "run_id": run_id,
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "model": model_name,
        "dataset": dataset,
        "seed": seed,
        "rmse": metrics.get("rmse"),
        "mae": metrics.get("mae"),
        "r2": metrics.get("r2"),
        "best_iteration": metrics.get("best_iteration"),
        "artifact_uri": artifact_uri,
        "host": socket.gethostname(),
    }
    errors = client.insert_rows_json(table, [row])
    if errors:
        raise RuntimeError(f"BigQuery insert failed: {errors}")
