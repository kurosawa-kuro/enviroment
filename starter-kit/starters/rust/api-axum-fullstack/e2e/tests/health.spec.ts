import { test, expect } from "../fixtures/server";

test.describe("Health Check", () => {
  test("GET /api/health returns healthy status", async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/api/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.status).toBe("healthy");
  });

  test("health check response has expected structure", async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/api/health`);
    const body = await res.json();

    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("data");
  });
});
