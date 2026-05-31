import { chromium } from "playwright";

const TARGET_URL = process.argv[2] || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

async function main() {
  console.log(`Accessing: ${TARGET_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // ネットワークレスポンスを監視
  page.on("response", async (response) => {
    const url = response.url();
    const status = response.status();
    const contentType = response.headers()["content-type"] || "unknown";

    // メインのドキュメントやAPI呼び出しをログ表示
    if (
      url.includes(TARGET_URL.split("?")[0]) ||
      url.includes("/youtubei/") ||
      url.includes("/api/")
    ) {
      console.log(`[Response] ${status} ${url.substring(0, 100)}...`);
      console.log(`  Content-Type: ${contentType}`);

      // HTMLレスポンスの場合、一部を表示
      if (contentType.includes("text/html") && status === 200) {
        try {
          const body = await response.text();
          console.log(`  Body length: ${body.length} chars`);
          console.log(`  Title: ${body.match(/<title>([^<]*)<\/title>/)?.[1] || "N/A"}`);
        } catch (e) {
          console.log(`  Could not read body: ${e.message}`);
        }
      }
      console.log("");
    }
  });

  // リクエストも監視（オプション）
  page.on("request", (request) => {
    const url = request.url();
    if (url === TARGET_URL) {
      console.log(`[Request] ${request.method()} ${url}`);
      console.log("");
    }
  });

  try {
    // ページにアクセス
    const response = await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("=== Main Response ===");
    console.log(`Status: ${response.status()}`);
    console.log(`URL: ${response.url()}`);
    console.log(`Headers:`);
    const headers = response.headers();
    console.log(`  content-type: ${headers["content-type"]}`);
    console.log(`  content-length: ${headers["content-length"] || "N/A"}`);
    console.log("");

    // ページタイトルを取得
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // ページの一部コンテンツを取得
    const content = await page.content();
    console.log(`Page HTML Length: ${content.length} chars`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await browser.close();
    console.log("\nBrowser closed.");
  }
}

main().catch(console.error);
