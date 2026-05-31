from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Item:
    id: int
    category: str
    amount: int


def read_items(path: Path) -> list[Item]:
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [
            Item(
                id=int(row["id"]),
                category=row["category"].strip(),
                amount=int(row["amount"]),
            )
            for row in reader
        ]


def summarize(items: list[Item]) -> dict[str, object]:
    total_amount = sum(item.amount for item in items)
    by_category: dict[str, dict[str, int | float]] = {}

    for item in items:
        bucket = by_category.setdefault(item.category, {"count": 0, "amount": 0})
        bucket["count"] = int(bucket["count"]) + 1
        bucket["amount"] = int(bucket["amount"]) + item.amount

    for bucket in by_category.values():
        count = int(bucket["count"])
        amount = int(bucket["amount"])
        bucket["average"] = amount / count if count else 0

    return {
        "count": len(items),
        "amount": total_amount,
        "by_category": by_category,
    }
