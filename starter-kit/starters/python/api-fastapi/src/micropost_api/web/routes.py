from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from micropost_api.db import get_db
from micropost_api.models import Micropost


router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parents[1] / "templates"))


@router.get("/healthz")
def healthz():
    return {"status": "ok"}


@router.get("/", response_class=HTMLResponse)
def index(request: Request, db: Session = Depends(get_db)):
    posts = db.query(Micropost).order_by(Micropost.created_at.desc()).all()
    return templates.TemplateResponse(request, "index.html", {"posts": posts})


@router.get("/microposts/new", response_class=HTMLResponse)
def new_form(request: Request):
    return templates.TemplateResponse(
        request,
        "form.html",
        {
            "post": None,
            "action": "/microposts",
            "title": "New Micropost",
        },
    )


@router.post("/microposts")
def create(
    title: str = Form(...),
    content: str = Form(...),
    db: Session = Depends(get_db),
):
    post = Micropost(title=title.strip(), content=content.strip())
    db.add(post)
    db.commit()
    db.refresh(post)
    return RedirectResponse(
        url=f"/microposts/{post.id}", status_code=status.HTTP_303_SEE_OTHER
    )


@router.get("/microposts/{post_id}", response_class=HTMLResponse)
def show(post_id: int, request: Request, db: Session = Depends(get_db)):
    post = db.get(Micropost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Micropost not found")
    return templates.TemplateResponse(request, "detail.html", {"post": post})


@router.get("/microposts/{post_id}/edit", response_class=HTMLResponse)
def edit_form(post_id: int, request: Request, db: Session = Depends(get_db)):
    post = db.get(Micropost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Micropost not found")
    return templates.TemplateResponse(
        request,
        "form.html",
        {
            "post": post,
            "action": f"/microposts/{post.id}",
            "title": "Edit Micropost",
        },
    )


@router.post("/microposts/{post_id}")
def update(
    post_id: int,
    title: str = Form(...),
    content: str = Form(...),
    db: Session = Depends(get_db),
):
    post = db.get(Micropost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Micropost not found")
    post.title = title.strip()
    post.content = content.strip()
    db.commit()
    return RedirectResponse(
        url=f"/microposts/{post.id}", status_code=status.HTTP_303_SEE_OTHER
    )


@router.post("/microposts/{post_id}/delete")
def delete(post_id: int, db: Session = Depends(get_db)):
    post = db.get(Micropost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Micropost not found")
    db.delete(post)
    db.commit()
    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
