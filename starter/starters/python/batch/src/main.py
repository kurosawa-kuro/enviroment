from __future__ import annotations

import argparse
import json
from pathlib import Path

from .processor import read_items, summarize

SAMPLE_CSV = """id,category,amount
1,book,1200
2,book,1800
3,tool,3200
4,tool,800
5,food,600
"""


def cmd_run(args: argparse.Namespace) -> int:
    items = read_items(args.input)
    summary = summarize(items)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote summary: {args.output}")
    return 0


def cmd_seed(args: argparse.Namespace) -> int:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(SAMPLE_CSV, encoding="utf-8")
    print(f"Wrote sample input: {args.output}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Simple CSV summary batch")
    subparsers = parser.add_subparsers(dest="command")

    parser.add_argument("--input", type=Path, default=Path("data/items.csv"))
    parser.add_argument("--output", type=Path, default=Path("output/summary.json"))
    parser.set_defaults(func=cmd_run)

    seed = subparsers.add_parser("seed", help="Write sample input CSV")
    seed.add_argument("--output", type=Path, default=Path("data/items.csv"))
    seed.set_defaults(func=cmd_seed)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
