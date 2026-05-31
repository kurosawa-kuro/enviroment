import { test, expect } from "../fixtures/server";

test.describe("Microposts", () => {
  test("API: create and list microposts", async ({ baseURL }) => {
    const title = `test-post-${Date.now()}`;

    // Create
    const createRes = await fetch(`${baseURL}/api/microposts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    expect(createRes.status).toBe(201);

    const created = await createRes.json();
    expect(created.data.title).toBe(title);

    // List
    const listRes = await fetch(`${baseURL}/api/microposts`);
    expect(listRes.status).toBe(200);

    const list = await listRes.json();
    const titles = list.data.map((p: { title: string }) => p.title);
    expect(titles).toContain(title);
  });

  test("API: get micropost by id", async ({ baseURL }) => {
    const title = `get-by-id-${Date.now()}`;

    const createRes = await fetch(`${baseURL}/api/microposts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const created = await createRes.json();
    const id = created.data.id;

    const getRes = await fetch(`${baseURL}/api/microposts/${id}`);
    expect(getRes.status).toBe(200);

    const got = await getRes.json();
    expect(got.data.id).toBe(id);
    expect(got.data.title).toBe(title);
  });

  test("API: 404 on non-existent micropost", async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/api/microposts/99999`);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe("error");
  });

  test("UI: create micropost via form", async ({ page, baseURL }) => {
    const title = `ui-post-${Date.now()}`;

    await page.goto(`${baseURL}/microposts`);

    // Fill the form and submit
    await page.fill('input[placeholder="タイトルを入力..."]', title);
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator(".alert.alert-success")).toBeVisible();

    // Verify post appears in table
    await expect(page.locator("table tbody")).toContainText(title);
  });
});
