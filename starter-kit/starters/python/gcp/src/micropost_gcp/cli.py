import argparse
import sys

from sqlalchemy.orm import Session

from micropost_gcp.db import SessionLocal, init_db
from micropost_gcp.exporters.gcp import (
    BigQueryTarget,
    dump_ndjson,
    load_to_bigquery,
    upload_ndjson_to_gcs,
)
from micropost_gcp.models import Micropost
from micropost_gcp.repository import (
    create_post,
    delete_post,
    get_post,
    list_posts,
    seed_posts,
    update_post,
)


def format_post(post: Micropost) -> str:
    return (
        f"[{post.id}] {post.title}\n"
        f"  created_at: {post.created_at.isoformat()}\n"
        f"  updated_at: {post.updated_at.isoformat()}\n"
        f"  content: {post.content}"
    )


def cmd_create(db: Session, args: argparse.Namespace) -> int:
    post = create_post(db, args.title, args.content)
    print("Created:")
    print(format_post(post))
    return 0


def cmd_list(db: Session, args: argparse.Namespace) -> int:
    posts = list_posts(db)
    if not posts:
        print("No microposts found.")
        return 0
    for post in posts:
        print(format_post(post))
        print("-" * 40)
    return 0


def cmd_show(db: Session, args: argparse.Namespace) -> int:
    post = get_post(db, args.id)
    if post is None:
        print(f"Micropost id={args.id} not found.", file=sys.stderr)
        return 1
    print(format_post(post))
    return 0


def cmd_update(db: Session, args: argparse.Namespace) -> int:
    if args.title is None and args.content is None:
        print("Specify at least --title or --content.", file=sys.stderr)
        return 1
    post = update_post(db, args.id, args.title, args.content)
    if post is None:
        print(f"Micropost id={args.id} not found.", file=sys.stderr)
        return 1
    print("Updated:")
    print(format_post(post))
    return 0


def cmd_delete(db: Session, args: argparse.Namespace) -> int:
    if delete_post(db, args.id):
        print(f"Deleted micropost id={args.id}.")
        return 0
    print(f"Micropost id={args.id} not found.", file=sys.stderr)
    return 1


def cmd_export_gcs(db: Session, args: argparse.Namespace) -> int:
    posts = list_posts(db)
    payload = dump_ndjson(posts)
    if args.output:
        with open(args.output, "wb") as file:
            file.write(payload)
        print(f"Wrote {len(posts)} rows to {args.output}")
    if args.gcs_uri:
        upload_ndjson_to_gcs(payload, args.gcs_uri)
        print(f"Uploaded {len(posts)} rows to {args.gcs_uri}")
    if not args.output and not args.gcs_uri:
        sys.stdout.buffer.write(payload)
    return 0


def cmd_export_bq(db: Session, args: argparse.Namespace) -> int:
    target = BigQueryTarget.parse(args.table)
    posts = list_posts(db)
    if not posts:
        print("No microposts to export.")
        return 0
    written = load_to_bigquery(posts, target, write_disposition=args.write_disposition)
    print(f"Loaded {written} rows into {target.ref} ({args.write_disposition})")
    return 0


def cmd_seed(db: Session, args: argparse.Namespace) -> int:
    for post in seed_posts(db):
        print(f"Seeded id={post.id} title={post.title!r}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Micropost CRUD batch (SQLite + GCP)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_create = subparsers.add_parser("create", help="Create a micropost")
    p_create.add_argument("--title", required=True)
    p_create.add_argument("--content", required=True)
    p_create.set_defaults(func=cmd_create)

    p_list = subparsers.add_parser("list", help="List microposts")
    p_list.set_defaults(func=cmd_list)

    p_show = subparsers.add_parser("show", help="Show a micropost by id")
    p_show.add_argument("id", type=int)
    p_show.set_defaults(func=cmd_show)

    p_update = subparsers.add_parser("update", help="Update a micropost")
    p_update.add_argument("id", type=int)
    p_update.add_argument("--title")
    p_update.add_argument("--content")
    p_update.set_defaults(func=cmd_update)

    p_delete = subparsers.add_parser("delete", help="Delete a micropost by id")
    p_delete.add_argument("id", type=int)
    p_delete.set_defaults(func=cmd_delete)

    p_seed = subparsers.add_parser("seed", help="Insert sample microposts")
    p_seed.set_defaults(func=cmd_seed)

    p_export_gcs = subparsers.add_parser(
        "export-gcs", help="Export microposts as NDJSON (stdout / file / GCS)"
    )
    p_export_gcs.add_argument("--output", help="Local file path to write NDJSON")
    p_export_gcs.add_argument("--gcs-uri", help="gs://bucket/path.ndjson destination")
    p_export_gcs.set_defaults(func=cmd_export_gcs)

    p_export_bq = subparsers.add_parser(
        "export-bq", help="Load microposts into BigQuery"
    )
    p_export_bq.add_argument(
        "--table", required=True, help="BigQuery table: project.dataset.table"
    )
    p_export_bq.add_argument(
        "--write-disposition",
        choices=["WRITE_TRUNCATE", "WRITE_APPEND", "WRITE_EMPTY"],
        default="WRITE_TRUNCATE",
    )
    p_export_bq.set_defaults(func=cmd_export_bq)

    return parser


def main(argv: list[str] | None = None) -> int:
    init_db()
    parser = build_parser()
    args = parser.parse_args(argv)

    db = SessionLocal()
    try:
        return args.func(db, args)
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
