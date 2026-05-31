from __future__ import annotations

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from housing_ml.infra.gcs import GcsPrefix


class GcsPrefixTest(unittest.TestCase):
    def test_parse_and_child_uri(self) -> None:
        prefix = GcsPrefix.parse("gs://bucket/models").child("run-1")

        self.assertEqual(prefix.bucket, "bucket")
        self.assertEqual(prefix.prefix, "models/run-1")
        self.assertEqual(prefix.uri("model.txt"), "gs://bucket/models/run-1/model.txt")

    def test_rejects_non_gcs_uri(self) -> None:
        with self.assertRaises(ValueError):
            GcsPrefix.parse("https://example.com/bucket")


if __name__ == "__main__":
    unittest.main()
