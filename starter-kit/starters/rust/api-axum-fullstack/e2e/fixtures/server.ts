import { test as base } from "@playwright/test";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import * as net from "node:net";
import * as path from "node:path";

type ServerFixture = {
  baseURL: string;
};

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        reject(new Error("Failed to get free port"));
      }
    });
    srv.on("error", reject);
  });
}

async function waitForHealthy(
  baseURL: string,
  timeoutMs = 30_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseURL}/api/health`);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server failed to become healthy within ${timeoutMs}ms`);
}

// Worker-scoped fixture: one server per worker
export const test = base.extend<object, { server: ServerFixture }>({
  server: [
    async ({}, use) => {
      const projectRoot = path.resolve(__dirname, "..");
      const backendRoot = path.resolve(projectRoot, "..");
      const staticDir = path.resolve(backendRoot, "client", "dist");

      // Build the binary (incremental - fast on subsequent runs)
      execSync("cargo build", {
        cwd: backendRoot,
        stdio: "inherit",
      });

      const port = await getFreePort();
      const baseURL = `http://127.0.0.1:${port}`;
      const binaryPath = path.resolve(backendRoot, "target", "debug", "starter");

      const child: ChildProcess = spawn(binaryPath, [], {
        cwd: backendRoot,
        env: {
          ...process.env,
          PORT: String(port),
          DB_PATH: ":memory:",
          STATIC_DIR: staticDir,
          RUST_LOG: "warn",
        },
        stdio: "pipe",
      });

      child.stderr?.on("data", (data: Buffer) => {
        const msg = data.toString();
        if (msg.includes("ERROR") || msg.includes("WARN")) {
          process.stderr.write(`[server] ${msg}`);
        }
      });

      await waitForHealthy(baseURL);

      await use({ baseURL });

      // Cleanup
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 5_000);
        child.on("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
    { scope: "worker" },
  ],

  // Inject baseURL into each test's page context
  baseURL: async ({ server }, use) => {
    await use(server.baseURL);
  },
});

export { expect } from "@playwright/test";
