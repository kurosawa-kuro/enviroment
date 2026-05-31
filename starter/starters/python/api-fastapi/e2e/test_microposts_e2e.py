import re

from playwright.sync_api import Page, expect


def _accept_dialogs(page: Page) -> None:
    page.on("dialog", lambda dialog: dialog.accept())


def test_index_empty_state(page: Page, app_url: str):
    page.goto(app_url + "/")
    expect(page.locator("h1")).to_have_text("Microposts")
    expect(page.get_by_text("No microposts yet")).to_be_visible()


def test_new_form_renders(page: Page, app_url: str):
    page.goto(app_url + "/microposts/new")
    expect(page.locator("h1")).to_have_text("New Micropost")
    expect(page.locator("#title")).to_be_visible()
    expect(page.locator("#content")).to_be_visible()


def test_create_micropost_redirects_to_detail(page: Page, app_url: str):
    page.goto(app_url + "/microposts/new")
    page.locator("#title").fill("Hello")
    page.locator("#content").fill("World body")
    page.get_by_role("button", name="Save").click()

    expect(page).to_have_url(re.compile(r"/microposts/\d+$"))
    expect(page.locator("h1")).to_have_text("Hello")
    expect(page.get_by_text("World body")).to_be_visible()


def test_index_lists_created_posts(page: Page, app_url: str):
    for title, body in [("First", "A"), ("Second", "B")]:
        page.goto(app_url + "/microposts/new")
        page.locator("#title").fill(title)
        page.locator("#content").fill(body)
        page.get_by_role("button", name="Save").click()

    page.goto(app_url + "/")
    expect(page.get_by_role("link", name="First")).to_be_visible()
    expect(page.get_by_role("link", name="Second")).to_be_visible()


def test_edit_form_prefilled_and_updates(page: Page, app_url: str):
    page.goto(app_url + "/microposts/new")
    page.locator("#title").fill("Old title")
    page.locator("#content").fill("Old body")
    page.get_by_role("button", name="Save").click()
    expect(page).to_have_url(re.compile(r"/microposts/\d+$"))

    page.get_by_role("button", name="Edit").click()
    expect(page.locator("h1")).to_have_text("Edit Micropost")
    expect(page.locator("#title")).to_have_value("Old title")
    expect(page.locator("#content")).to_have_value("Old body")

    page.locator("#title").fill("New title")
    page.locator("#content").fill("New body")
    page.get_by_role("button", name="Save").click()

    expect(page.locator("h1")).to_have_text("New title")
    expect(page.get_by_text("New body")).to_be_visible()


def test_delete_removes_post(page: Page, app_url: str):
    page.goto(app_url + "/microposts/new")
    page.locator("#title").fill("Doomed")
    page.locator("#content").fill("bye")
    page.get_by_role("button", name="Save").click()
    expect(page.locator("h1")).to_have_text("Doomed")

    _accept_dialogs(page)
    page.get_by_role("button", name="Delete").click()

    expect(page).to_have_url(re.compile(r"/$"))
    expect(page.get_by_text("No microposts yet")).to_be_visible()


def test_show_404_for_missing(page: Page, app_url: str):
    response = page.goto(app_url + "/microposts/999999")
    assert response is not None
    assert response.status == 404
