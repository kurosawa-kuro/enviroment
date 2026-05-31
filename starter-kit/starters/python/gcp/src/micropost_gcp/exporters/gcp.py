"""GCP helpers for batch: BigQuery load and GCS NDJSON export."""

from __future__ import annotations

import io
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

from micropost_gcp.models import Micropost


BQ_SCHEMA = [
    {"name": "id", "type": "INTEGER", "mode": "REQUIRED"},
    {"name": "title", "type": "STRING", "mode": "REQUIRED"},
    {"name": "content", "type": "STRING", "mode": "REQUIRED"},
    {"name": "created_at", "type": "TIMESTAMP", "mode": "REQUIRED"},
    {"name": "updated_at", "type": "TIMESTAMP", "mode": "REQUIRED"},
]


@dataclass(frozen=True)
class BigQueryTarget:
    project: str
    dataset: str
    table: str

    @classmethod
    def parse(cls, spec: str) -> "BigQueryTarget":
        parts = spec.split(".")
        if len(parts) != 3 or not all(parts):
            raise ValueError(
                f"BigQuery table must be 'project.dataset.table', got: {spec!r}"
            )
        return cls(project=parts[0], dataset=parts[1], table=parts[2])

    @property
    def ref(self) -> str:
        return f"{self.project}.{self.dataset}.{self.table}"


def post_to_row(post: Micropost) -> dict:
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "created_at": _iso_utc(post.created_at),
        "updated_at": _iso_utc(post.updated_at),
    }


def _iso_utc(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"


def dump_ndjson(posts: Iterable[Micropost]) -> bytes:
    buf = io.BytesIO()
    for post in posts:
        buf.write(json.dumps(post_to_row(post), ensure_ascii=False).encode("utf-8"))
        buf.write(b"\n")
    return buf.getvalue()


def upload_ndjson_to_gcs(data: bytes, gcs_uri: str) -> str:
    if not gcs_uri.startswith("gs://"):
        raise ValueError(f"gcs_uri must start with 'gs://': {gcs_uri!r}")
    bucket_name, _, blob_name = gcs_uri[len("gs://") :].partition("/")
    if not bucket_name or not blob_name:
        raise ValueError(f"Invalid GCS URI: {gcs_uri!r}")

    from google.cloud import storage  # type: ignore

    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.upload_from_string(data, content_type="application/x-ndjson")
    return gcs_uri


def load_to_bigquery(
    posts: list[Micropost],
    target: BigQueryTarget,
    *,
    write_disposition: str = "WRITE_TRUNCATE",
) -> int:
    from google.cloud import bigquery  # type: ignore

    client = bigquery.Client(project=target.project)
    rows = [post_to_row(p) for p in posts]

    job_config = bigquery.LoadJobConfig(
        schema=[bigquery.SchemaField(**field) for field in BQ_SCHEMA],
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        write_disposition=write_disposition,
        create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
    )
    payload = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows).encode(
        "utf-8"
    )
    job = client.load_table_from_file(
        io.BytesIO(payload), target.ref, job_config=job_config
    )
    job.result()
    return len(rows)
