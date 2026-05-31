import { test, expect } from '@playwright/test';

test('GET /api/health returns ok', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('GET / returns HTML page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Welcome to Hono/);
});
