from __future__ import annotations

import tempfile
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from housing_ml.registry.manifest import build_run_manifest, write_run_manifest


class ManifestTest(unittest.TestCase):
    def test_build_and_write_manifest(self) -> None:
        payload = build_run_manifest(
            run_id="run-1",
            model_name="model",
            dataset_name="dataset",
            seed=42,
            metrics={"rmse": 1.2},
            artifact_uri="gs://bucket/models/run-1",
            feature_columns=["a"],
            feature_dtypes={"a": "float64"},
        )

        self.assertEqual(payload["run_id"], "run-1")
        self.assertEqual(payload["feature_schema"]["columns"], ["a"])

        with tempfile.TemporaryDirectory() as tmp:
            path = write_run_manifest(Path(tmp), payload)
            self.assertTrue(path.exists())
            self.assertIn('"run_id": "run-1"', path.read_text())


if __name__ == "__main__":
    unittest.main()
