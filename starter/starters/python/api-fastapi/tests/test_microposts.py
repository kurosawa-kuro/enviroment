from micropost_api.models import Micropost


def test_index_empty(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Microposts" in res.text
    assert "No microposts yet" in res.text


def test_new_form_renders(client):
    res = client.get("/microposts/new")
    assert res.status_code == 200
    assert "New Micropost" in res.text
    assert 'name="title"' in res.text
    assert 'name="content"' in res.text


def test_create_redirects_to_detail(client, db_session):
    session, _ = db_session
    res = client.post(
        "/microposts",
        data={"title": "Hello", "content": "World"},
        follow_redirects=False,
    )
    assert res.status_code == 303
    assert res.headers["location"].startswith("/microposts/")

    posts = session.query(Micropost).all()
    assert len(posts) == 1
    assert posts[0].title == "Hello"
    assert posts[0].content == "World"


def test_create_trims_whitespace(client, db_session):
    session, _ = db_session
    client.post(
        "/microposts",
        data={"title": "  trimmed  ", "content": "  body  "},
        follow_redirects=False,
    )
    post = session.query(Micropost).first()
    assert post.title == "trimmed"
    assert post.content == "body"


def test_create_requires_title_and_content(client):
    res = client.post("/microposts", data={"title": "only title"})
    assert res.status_code == 422


def test_index_lists_posts(client):
    client.post("/microposts", data={"title": "First", "content": "A"})
    client.post("/microposts", data={"title": "Second", "content": "B"})
    res = client.get("/")
    assert res.status_code == 200
    assert "First" in res.text
    assert "Second" in res.text


def test_show_returns_post(client):
    client.post("/microposts", data={"title": "Detail", "content": "body"})
    res = client.get("/microposts/1")
    assert res.status_code == 200
    assert "Detail" in res.text
    assert "body" in res.text


def test_show_404_for_missing(client):
    res = client.get("/microposts/999")
    assert res.status_code == 404


def test_edit_form_prefilled(client):
    client.post("/microposts", data={"title": "Old", "content": "Body"})
    res = client.get("/microposts/1/edit")
    assert res.status_code == 200
    assert "Edit Micropost" in res.text
    assert 'value="Old"' in res.text
    assert "Body" in res.text


def test_edit_form_404(client):
    res = client.get("/microposts/999/edit")
    assert res.status_code == 404


def test_update_persists_changes(client, db_session):
    session, _ = db_session
    client.post("/microposts", data={"title": "Old", "content": "Body"})
    res = client.post(
        "/microposts/1",
        data={"title": "New", "content": "Updated"},
        follow_redirects=False,
    )
    assert res.status_code == 303
    assert res.headers["location"] == "/microposts/1"

    session.expire_all()
    post = session.get(Micropost, 1)
    assert post.title == "New"
    assert post.content == "Updated"


def test_update_404(client):
    res = client.post(
        "/microposts/999",
        data={"title": "x", "content": "y"},
        follow_redirects=False,
    )
    assert res.status_code == 404


def test_delete_removes_post(client, db_session):
    session, _ = db_session
    client.post("/microposts", data={"title": "A", "content": "B"})
    res = client.post("/microposts/1/delete", follow_redirects=False)
    assert res.status_code == 303
    assert res.headers["location"] == "/"

    session.expire_all()
    assert session.get(Micropost, 1) is None


def test_delete_404(client):
    res = client.post("/microposts/999/delete", follow_redirects=False)
    assert res.status_code == 404


def test_full_crud_flow(client, db_session):
    session, _ = db_session

    r = client.post(
        "/microposts",
        data={"title": "T1", "content": "C1"},
        follow_redirects=False,
    )
    loc = r.headers["location"]

    r = client.get(loc)
    assert r.status_code == 200
    assert "T1" in r.text

    post_id = loc.rsplit("/", 1)[-1]
    client.post(
        f"/microposts/{post_id}",
        data={"title": "T2", "content": "C2"},
        follow_redirects=False,
    )
    r = client.get(f"/microposts/{post_id}")
    assert "T2" in r.text

    client.post(f"/microposts/{post_id}/delete", follow_redirects=False)
    session.expire_all()
    assert session.query(Micropost).count() == 0
