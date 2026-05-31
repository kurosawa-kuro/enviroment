from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path


def new_run_id() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{ts}-{uuid.uuid4().hex[:8]}"


def build_run_manifest(
    *,
    run_id: str,
    model_name: str,
    dataset_name: str,
    seed: int,
    metrics: dict,
    artifact_uri: str | None,
    feature_columns: list[str],
    feature_dtypes: dict[str, str],
) -> dict:
    return {
        "run_id": run_id,
        "model": model_name,
        "dataset": dataset_name,
        "seed": seed,
        "metrics": metrics,
        "artifact_uri": artifact_uri,
        "feature_schema": {
            "columns": feature_columns,
            "dtypes": feature_dtypes,
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def write_run_manifest(output_dir: Path, payload: dict) -> Path:
    path = output_dir / "run.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    return path
