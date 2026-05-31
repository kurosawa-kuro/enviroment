import { test, expect } from "../fixtures/server";

test.describe("SPA Fallback", () => {
  test("root path serves the React SPA", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await expect(page.locator('a[href="/microposts"]')).toBeVisible();
  });

  test("/about serves index.html", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/about`);
    // SPA loads without 404 — check for the sidebar which is always present
    await expect(page.locator("aside.sidebar")).toBeVisible();
  });

  test("/microposts serves index.html", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/microposts`);
    await expect(page.locator("h2")).toContainText("Microposts");
  });

  test("/nonexistent-page serves index.html", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/some/random/path`);
    // SPA loads — sidebar is present
    await expect(page.locator("aside.sidebar")).toBeVisible();
  });

  test("API 404: unknown API route returns JSON error", async ({
    baseURL,
  }) => {
    const res = await fetch(`${baseURL}/api/nonexistent`);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe("error");
  });
});
