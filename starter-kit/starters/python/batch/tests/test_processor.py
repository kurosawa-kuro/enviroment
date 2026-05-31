import tempfile
import unittest
from pathlib import Path

from src.processor import Item, read_items, summarize


class ProcessorTest(unittest.TestCase):
    def test_summarize_by_category(self) -> None:
        summary = summarize(
            [
                Item(id=1, category="book", amount=1200),
                Item(id=2, category="book", amount=1800),
                Item(id=3, category="tool", amount=3000),
            ]
        )

        self.assertEqual(summary["count"], 3)
        self.assertEqual(summary["amount"], 6000)
        self.assertEqual(
            summary["by_category"]["book"],
            {
                "count": 2,
                "amount": 3000,
                "average": 1500,
            },
        )

    def test_read_items(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "items.csv"
            path.write_text("id,category,amount\n1,food,500\n", encoding="utf-8")

            self.assertEqual(read_items(path), [Item(id=1, category="food", amount=500)])


if __name__ == "__main__":
    unittest.main()
