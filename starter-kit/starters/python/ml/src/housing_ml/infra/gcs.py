from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GcsPrefix:
    bucket: str
    prefix: str

    @classmethod
    def parse(cls, uri: str) -> "GcsPrefix":
        if not uri.startswith("gs://"):
            raise ValueError(f"gcs uri must start with gs://: {uri!r}")
        bucket, _, prefix = uri[len("gs://"):].partition("/")
        if not bucket:
            raise ValueError(f"bucket missing in {uri!r}")
        return cls(bucket=bucket, prefix=prefix.strip("/"))

    def child(self, sub: str) -> "GcsPrefix":
        new_prefix = "/".join(p for p in [self.prefix, sub.strip("/")] if p)
        return GcsPrefix(bucket=self.bucket, prefix=new_prefix)

    def uri(self, *parts: str) -> str:
        joined = "/".join(p.strip("/") for p in parts if p)
        base = f"gs://{self.bucket}"
        if self.prefix:
            base = f"{base}/{self.prefix}"
        return f"{base}/{joined}" if joined else base


def upload_directory(local_dir: Path, destination: GcsPrefix) -> list[str]:
    from google.cloud import storage  # type: ignore

    client = storage.Client()
    bucket = client.bucket(destination.bucket)
    uploaded: list[str] = []
    for path in sorted(local_dir.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(local_dir).as_posix()
        blob_name = f"{destination.prefix}/{rel}" if destination.prefix else rel
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(str(path))
        uploaded.append(f"gs://{destination.bucket}/{blob_name}")
    return uploaded
