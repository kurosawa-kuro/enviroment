import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";

const OUTPUT_DIR = new URL("./data/output", import.meta.url).pathname;

/**
 * YouTube字幕取得ツール
 *
 * 使用方法:
 *   node youtube-subtitle.js <VIDEO_URL_OR_ID>
 *   node youtube-subtitle.js https://www.youtube.com/watch?v=VIDEO_ID
 *   node youtube-subtitle.js VIDEO_ID
 *
 * 出力:
 *   - data/output/<videoId>_subtitle.json   (字幕データ)
 *   - data/output/<videoId>_meta.json       (メタデータ)
 */

// 字幕ステータス
const SubtitleStatus = {
  PENDING: "pending",         // 公開直後・猶予期間
  AVAILABLE: "available",     // 字幕あり（未取得）
  FETCHED: "fetched",         // 取得済み
  EXPIRED: "expired",         // 一定期間経過しても無し
  UNAVAILABLE: "unavailable"  // 字幕なし
};

/**
 * VideoIDを抽出
 */
function extractVideoId(input) {
  const urlMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  throw new Error(`Invalid video ID or URL: ${input}`);
}

/**
 * 字幕JSONからテキストを抽出
 */
function extractSubtitleText(subtitleJson) {
  if (!subtitleJson || !subtitleJson.events) return "";
  return subtitleJson.events
    .filter(e => e.segs)
    .flatMap(e => e.segs)
    .map(s => s.utf8 || "")
    .join("")
    .replace(/\n+/g, "\n")
    .trim();
}

/**
 * 字幕イベントをタイムスタンプ付きで抽出
 */
function extractSubtitleWithTimestamps(subtitleJson) {
  if (!subtitleJson || !subtitleJson.events) return [];
  return subtitleJson.events
    .filter(e => e.segs && e.tStartMs !== undefined)
    .map(e => ({
      startMs: e.tStartMs,
      durationMs: e.dDurationMs || 0,
      text: e.segs.map(s => s.utf8 || "").join("").trim()
    }))
    .filter(e => e.text);
}

/**
 * ページHTMLから字幕トラック情報を抽出
 */
async function extractCaptionTracksFromPage(page) {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) {
      const text = script.textContent || "";
      const match = text.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const captions = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (captions && captions.length > 0) {
            return captions.map(track => ({
              baseUrl: track.baseUrl,
              languageCode: track.languageCode,
              name: track.name?.simpleText || track.name?.runs?.[0]?.text || "",
              kind: track.kind || "manual"
            }));
          }
        } catch (e) {}
      }
    }
    return null;
  });
}

/**
 * YouTube字幕を取得（video.play() + Network Interception方式）
 */
async function fetchYouTubeSubtitle(videoIdOrUrl) {
  const videoId = extractVideoId(videoIdOrUrl);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`\n=== YouTube Subtitle Fetcher ===`);
  console.log(`Video ID: ${videoId}`);
  console.log(`URL: ${videoUrl}\n`);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // headless検知回避のための設定
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
    ]
  });
  const context = await browser.newContext({
    locale: "ja-JP",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
  });

  // webdriverプロパティを削除
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();

  let subtitleJson = null;
  let subtitleLang = null;
  let subtitleType = null;
  let captionTracks = null;
  let title = "";
  let status = SubtitleStatus.UNAVAILABLE;
  let errorMessage = null;

  // ① Network フック（字幕データをインターセプト）
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("timedtext")) {
      try {
        const text = await res.text();
        if (text && text.length > 0) {
          // JSON形式を試す
          try {
            const json = JSON.parse(text);
            if (json?.events?.length) {
              subtitleJson = json;
              const langMatch = url.match(/[?&]lang=([^&]+)/);
              subtitleLang = langMatch ? decodeURIComponent(langMatch[1]) : "unknown";
              subtitleType = url.includes("kind=asr") ? "auto" : "manual";
              console.log(`[Captured] ${json.events.length} subtitle events (${subtitleLang}, ${subtitleType})`);
            }
          } catch {
            // XML形式の可能性
            if (text.includes("<text")) {
              const events = [];
              const regex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
              let match;
              while ((match = regex.exec(text)) !== null) {
                events.push({
                  tStartMs: Math.round(parseFloat(match[1]) * 1000),
                  dDurationMs: Math.round(parseFloat(match[2]) * 1000),
                  segs: [{ utf8: match[3].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") }]
                });
              }
              if (events.length > 0) {
                subtitleJson = { events };
                const langMatch = url.match(/[?&]lang=([^&]+)/);
                subtitleLang = langMatch ? decodeURIComponent(langMatch[1]) : "unknown";
                subtitleType = url.includes("kind=asr") ? "auto" : "manual";
                console.log(`[Captured XML] ${events.length} subtitle events (${subtitleLang})`);
              }
            }
          }
        }
      } catch (e) {
        // ignore errors
      }
    }
  });

  try {
    // ② ページ遷移（networkidle は使わない）
    await page.goto(videoUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // タイトル取得
    title = await page.title();
    title = title.replace(/ - YouTube$/, "").trim();
    console.log(`Title: ${title}`);

    // 字幕トラック情報を抽出
    captionTracks = await extractCaptionTracksFromPage(page);

    // 日本語・英語のみを対象
    const targetLangs = ['ja', 'en'];
    const filteredTracks = captionTracks?.filter(t =>
      targetLangs.includes(t.languageCode)
    ) || [];

    if (filteredTracks.length > 0) {
      console.log(`\n[Caption Tracks] ${filteredTracks.length} track(s) (ja/en only)`);
      filteredTracks.forEach(t =>
        console.log(`  - ${t.languageCode}: ${t.name} (${t.kind})`)
      );

      // ③ 再生を保証する（video.play() を直接叩く）
      console.log(`\n[Step 1] Starting video playback...`);
      await page.evaluate(() => {
        const video = document.querySelector("video");
        if (video) {
          video.muted = true;
          video.play();
        }
      });
      await page.waitForTimeout(1500);
      console.log(`[Step 1] Done`);

      // ④ 字幕 ON
      console.log(`[Step 2] Clicking CC button...`);
      const cc = await page.$(".ytp-subtitles-button");
      if (cc) {
        await cc.click();
        console.log(`[Step 2] CC clicked`);
      } else {
        console.log(`[Step 2] CC button not found`);
      }
      await page.waitForTimeout(2000);

      // ⑤ まだ来なければ設定メニュー
      if (!subtitleJson) {
        console.log(`[Step 3] Trying settings menu...`);
        const settings = await page.$(".ytp-settings-button");
        if (settings) {
          await settings.click();
          await page.waitForTimeout(500);

          const items = await page.$$(".ytp-menuitem");
          for (const i of items) {
            const t = await i.textContent();
            if (t?.includes("字幕") || t?.includes("Subtitles") || t?.includes("Caption")) {
              await i.click();
              console.log(`[Step 3] Clicked subtitle menu`);
              await page.waitForTimeout(1000);

              // 最初の言語を選択（Offを除く）
              const langItems = await page.$$(".ytp-menuitem");
              if (langItems.length > 1) {
                await langItems[1].click();
                console.log(`[Step 3] Selected first language`);
                await page.waitForTimeout(2000);
              }
              break;
            }
          }
          await page.keyboard.press("Escape");
        }
      }

      // 言語情報を補完
      if (subtitleJson && !subtitleLang) {
        const selectedTrack = filteredTracks.find(t => t.languageCode === "ja")
          || filteredTracks.find(t => t.languageCode === "en")
          || filteredTracks[0];
        subtitleLang = selectedTrack.languageCode;
        subtitleType = selectedTrack.kind === "asr" ? "auto" : "manual";
      }
    } else {
      console.log(`\n[No Caption Tracks (ja/en)]`);
    }

  } catch (error) {
    errorMessage = error.message;
    console.error(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // ⑥ 判定（日本語・英語トラックが対象）
  const hasJaEnTracks = captionTracks?.some(t => ['ja', 'en'].includes(t.languageCode));

  if (subtitleJson) {
    status = SubtitleStatus.FETCHED;
    console.log(`\n[Result] Subtitle fetched successfully`);
  } else if (hasJaEnTracks) {
    // ja/enトラックはあるが取得できなかった → pending
    status = SubtitleStatus.PENDING;
    console.log(`\n[Result] Caption tracks (ja/en) exist but subtitle not intercepted (pending)`);
  } else {
    status = SubtitleStatus.UNAVAILABLE;
    console.log(`\n[Result] No Japanese/English subtitles available`);
  }

  // メタデータ作成
  const metadata = {
    videoId,
    title,
    url: videoUrl,
    subtitleStatus: status,
    subtitleLang: subtitleLang || null,
    subtitleType: subtitleType || null,
    availableTracks: captionTracks
      ? captionTracks
          .filter(t => ['ja', 'en'].includes(t.languageCode))
          .map(t => ({ lang: t.languageCode, name: t.name, kind: t.kind }))
      : [],
    discoveredAt: new Date().toISOString(),
    subtitleFetchedAt: status === SubtitleStatus.FETCHED ? new Date().toISOString() : null,
    error: errorMessage,
  };

  // メタデータ保存
  const metaPath = path.join(OUTPUT_DIR, `${videoId}_meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`Meta saved: ${metaPath}`);

  // 字幕データ保存
  if (subtitleJson) {
    const subtitleData = {
      videoId,
      title,
      lang: subtitleLang,
      type: subtitleType,
      fetchedAt: new Date().toISOString(),
      plainText: extractSubtitleText(subtitleJson),
      timedText: extractSubtitleWithTimestamps(subtitleJson),
      raw: subtitleJson,
    };

    const subtitlePath = path.join(OUTPUT_DIR, `${videoId}_subtitle.json`);
    await fs.writeFile(subtitlePath, JSON.stringify(subtitleData, null, 2), "utf-8");
    console.log(`Subtitle saved: ${subtitlePath}`);

    console.log(`\n=== Summary ===`);
    console.log(`Status: ${status}`);
    console.log(`Language: ${subtitleLang}`);
    console.log(`Type: ${subtitleType}`);
    console.log(`Text length: ${subtitleData.plainText.length} chars`);
    console.log(`Timed segments: ${subtitleData.timedText.length}`);

    // プレビュー
    console.log(`\n=== Preview (first 500 chars) ===`);
    console.log(subtitleData.plainText.substring(0, 500));
    if (subtitleData.plainText.length > 500) console.log("...");
  }

  return {
    metadata,
    subtitle: subtitleJson ? extractSubtitleText(subtitleJson) : null,
  };
}

/**
 * 複数動画を一括処理
 */
async function fetchMultipleSubtitles(videoIds) {
  const results = [];

  for (const id of videoIds) {
    try {
      const result = await fetchYouTubeSubtitle(id);
      results.push(result);
    } catch (error) {
      console.error(`Failed to fetch ${id}: ${error.message}`);
      results.push({ error: error.message, videoId: id });
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  const summaryPath = path.join(OUTPUT_DIR, `batch_summary_${Date.now()}.json`);
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nBatch summary saved: ${summaryPath}`);

  return results;
}

// CLI実行
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
YouTube Subtitle Fetcher

Usage:
  node youtube-subtitle.js <VIDEO_URL_OR_ID>
  node youtube-subtitle.js <VIDEO_ID_1> <VIDEO_ID_2> ...

Examples:
  node youtube-subtitle.js https://www.youtube.com/watch?v=dQw4w9WgXcQ
  node youtube-subtitle.js dQw4w9WgXcQ
  node youtube-subtitle.js dQw4w9WgXcQ abc123xyz45

Output:
  ./data/output/<videoId>_meta.json     - Video metadata with subtitle status
  ./data/output/<videoId>_subtitle.json - Subtitle data (if available)
`);
    return;
  }

  if (args.length === 1) {
    await fetchYouTubeSubtitle(args[0]);
  } else {
    await fetchMultipleSubtitles(args);
  }
}

main().catch(console.error);

export { fetchYouTubeSubtitle, fetchMultipleSubtitles, SubtitleStatus };
