from sqlalchemy.orm import Session

from micropost_gcp.models import Micropost


def create_post(db: Session, title: str, content: str) -> Micropost:
    post = Micropost(title=title.strip(), content=content.strip())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_posts(db: Session) -> list[Micropost]:
    return db.query(Micropost).order_by(Micropost.created_at.desc()).all()


def get_post(db: Session, post_id: int) -> Micropost | None:
    return db.get(Micropost, post_id)


def update_post(
    db: Session, post_id: int, title: str | None, content: str | None
) -> Micropost | None:
    post = db.get(Micropost, post_id)
    if post is None:
        return None
    if title is not None:
        post.title = title.strip()
    if content is not None:
        post.content = content.strip()
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post_id: int) -> bool:
    post = db.get(Micropost, post_id)
    if post is None:
        return False
    db.delete(post)
    db.commit()
    return True


def seed_posts(db: Session) -> list[Micropost]:
    samples = [
        ("Hello", "First micropost from batch."),
        ("SQLAlchemy", "Batch CRUD with SQLite."),
        ("MLOps", "Batch pipeline sample entry."),
    ]
    return [create_post(db, title, content) for title, content in samples]
