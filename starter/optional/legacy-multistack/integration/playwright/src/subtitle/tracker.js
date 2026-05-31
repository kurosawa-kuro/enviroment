import fs from "fs/promises";
import path from "path";
import { fetchYouTubeSubtitle, SubtitleStatus } from "./youtube.js";

const OUTPUT_DIR = new URL("./data/output", import.meta.url).pathname;
const TRACKER_FILE = path.join(OUTPUT_DIR, "tracker.json");

// 24時間後に expired に落とす
const EXPIRY_HOURS = 24;

/**
 * 字幕ステータストラッカー
 *
 * 動画リストを管理し、字幕取得状況を追跡
 *
 * ステータス遷移:
 *   pending -> available -> fetched
 *           -> expired (24時間経過で字幕なし)
 *           -> unavailable (字幕なしが確定)
 */

/**
 * トラッカーデータを読み込み
 */
async function loadTracker() {
  try {
    const data = await fs.readFile(TRACKER_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { videos: {}, lastUpdated: null };
  }
}

/**
 * トラッカーデータを保存
 */
async function saveTracker(tracker) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  tracker.lastUpdated = new Date().toISOString();
  await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2), "utf-8");
}

/**
 * 動画を追加（pending状態）
 */
async function addVideo(videoId, title = null) {
  const tracker = await loadTracker();

  if (tracker.videos[videoId]) {
    console.log(`Video ${videoId} already exists with status: ${tracker.videos[videoId].subtitleStatus}`);
    return tracker.videos[videoId];
  }

  tracker.videos[videoId] = {
    videoId,
    title,
    subtitleStatus: SubtitleStatus.PENDING,
    discoveredAt: new Date().toISOString(),
    lastCheckedAt: null,
    subtitleFetchedAt: null,
    checkCount: 0,
  };

  await saveTracker(tracker);
  console.log(`Added video ${videoId} with status: pending`);
  return tracker.videos[videoId];
}

/**
 * 複数動画を一括追加
 */
async function addVideos(videoIds) {
  const results = [];
  for (const id of videoIds) {
    const result = await addVideo(id);
    results.push(result);
  }
  return results;
}

/**
 * pending/available 状態の動画を取得
 */
async function getPendingVideos() {
  const tracker = await loadTracker();
  const now = Date.now();

  return Object.values(tracker.videos).filter(v => {
    // fetched, expired, unavailable は除外
    if ([SubtitleStatus.FETCHED, SubtitleStatus.EXPIRED, SubtitleStatus.UNAVAILABLE].includes(v.subtitleStatus)) {
      return false;
    }

    // pending で 24時間経過 -> expired に更新
    if (v.subtitleStatus === SubtitleStatus.PENDING) {
      const discoveredAt = new Date(v.discoveredAt).getTime();
      const hoursPassed = (now - discoveredAt) / (1000 * 60 * 60);

      if (hoursPassed > EXPIRY_HOURS && v.checkCount > 0) {
        // expired に更新（次回のsync時）
        return false;
      }
    }

    return true;
  });
}

/**
 * 期限切れ動画を expired に更新
 */
async function expireOldPending() {
  const tracker = await loadTracker();
  const now = Date.now();
  let expiredCount = 0;

  for (const video of Object.values(tracker.videos)) {
    if (video.subtitleStatus === SubtitleStatus.PENDING && video.checkCount > 0) {
      const discoveredAt = new Date(video.discoveredAt).getTime();
      const hoursPassed = (now - discoveredAt) / (1000 * 60 * 60);

      if (hoursPassed > EXPIRY_HOURS) {
        video.subtitleStatus = SubtitleStatus.EXPIRED;
        expiredCount++;
      }
    }
  }

  if (expiredCount > 0) {
    await saveTracker(tracker);
    console.log(`Expired ${expiredCount} videos`);
  }

  return expiredCount;
}

/**
 * 字幕チェック＆取得を実行
 */
async function checkAndFetch(videoId) {
  const tracker = await loadTracker();
  const video = tracker.videos[videoId];

  if (!video) {
    console.log(`Video ${videoId} not found in tracker. Adding...`);
    await addVideo(videoId);
    return checkAndFetch(videoId);
  }

  // すでに fetched なら何もしない
  if (video.subtitleStatus === SubtitleStatus.FETCHED) {
    console.log(`Video ${videoId} already fetched`);
    return video;
  }

  // expired, unavailable も何もしない
  if ([SubtitleStatus.EXPIRED, SubtitleStatus.UNAVAILABLE].includes(video.subtitleStatus)) {
    console.log(`Video ${videoId} is ${video.subtitleStatus}, skipping`);
    return video;
  }

  console.log(`\nChecking video: ${videoId}`);

  try {
    const result = await fetchYouTubeSubtitle(videoId);

    // トラッカー更新
    video.lastCheckedAt = new Date().toISOString();
    video.checkCount++;

    if (result.subtitle) {
      video.subtitleStatus = SubtitleStatus.FETCHED;
      video.subtitleFetchedAt = new Date().toISOString();
      video.title = result.metadata.title;
      console.log(`Video ${videoId} -> fetched`);
    } else {
      // 字幕なし
      video.title = result.metadata.title;

      // チェック回数と経過時間で判定
      const discoveredAt = new Date(video.discoveredAt).getTime();
      const hoursPassed = (Date.now() - discoveredAt) / (1000 * 60 * 60);

      if (hoursPassed > EXPIRY_HOURS) {
        video.subtitleStatus = SubtitleStatus.EXPIRED;
        console.log(`Video ${videoId} -> expired (no subtitle after ${EXPIRY_HOURS}h)`);
      } else {
        video.subtitleStatus = SubtitleStatus.PENDING;
        console.log(`Video ${videoId} -> pending (will retry later)`);
      }
    }

    await saveTracker(tracker);
    return video;

  } catch (error) {
    console.error(`Error checking ${videoId}: ${error.message}`);
    video.lastCheckedAt = new Date().toISOString();
    video.checkCount++;
    video.lastError = error.message;
    await saveTracker(tracker);
    return video;
  }
}

/**
 * pending/available な全動画をチェック
 */
async function syncAll() {
  // 期限切れを先に処理
  await expireOldPending();

  const pending = await getPendingVideos();
  console.log(`\n=== Sync All ===`);
  console.log(`Pending videos: ${pending.length}`);

  if (pending.length === 0) {
    console.log("No pending videos to check");
    return [];
  }

  const results = [];
  for (const video of pending) {
    const result = await checkAndFetch(video.videoId);
    results.push(result);

    // レート制限対策
    await new Promise(r => setTimeout(r, 3000));
  }

  return results;
}

/**
 * ステータス一覧表示
 */
async function showStatus() {
  const tracker = await loadTracker();
  const videos = Object.values(tracker.videos);

  const stats = {
    total: videos.length,
    pending: videos.filter(v => v.subtitleStatus === SubtitleStatus.PENDING).length,
    available: videos.filter(v => v.subtitleStatus === SubtitleStatus.AVAILABLE).length,
    fetched: videos.filter(v => v.subtitleStatus === SubtitleStatus.FETCHED).length,
    expired: videos.filter(v => v.subtitleStatus === SubtitleStatus.EXPIRED).length,
    unavailable: videos.filter(v => v.subtitleStatus === SubtitleStatus.UNAVAILABLE).length,
  };

  console.log(`\n=== Subtitle Tracker Status ===`);
  console.log(`Total: ${stats.total}`);
  console.log(`  pending:     ${stats.pending}`);
  console.log(`  available:   ${stats.available}`);
  console.log(`  fetched:     ${stats.fetched}`);
  console.log(`  expired:     ${stats.expired}`);
  console.log(`  unavailable: ${stats.unavailable}`);
  console.log(`\nLast updated: ${tracker.lastUpdated || "never"}`);

  return stats;
}

/**
 * 動画リスト表示
 */
async function listVideos(filter = null) {
  const tracker = await loadTracker();
  let videos = Object.values(tracker.videos);

  if (filter) {
    videos = videos.filter(v => v.subtitleStatus === filter);
  }

  console.log(`\n=== Video List ${filter ? `(${filter})` : "(all)"} ===`);
  for (const v of videos) {
    console.log(`${v.videoId} | ${v.subtitleStatus.padEnd(12)} | ${v.title || "(no title)"}`);
  }

  return videos;
}

// CLI
async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "add":
      if (args.length === 0) {
        console.log("Usage: node subtitle-tracker.js add <videoId> [videoId2] ...");
        return;
      }
      await addVideos(args);
      break;

    case "check":
      if (args.length === 0) {
        console.log("Usage: node subtitle-tracker.js check <videoId>");
        return;
      }
      await checkAndFetch(args[0]);
      break;

    case "sync":
      await syncAll();
      break;

    case "status":
      await showStatus();
      break;

    case "list":
      await listVideos(args[0] || null);
      break;

    case "expire":
      await expireOldPending();
      break;

    default:
      console.log(`
Subtitle Tracker - Manage YouTube subtitle fetch status

Commands:
  add <videoId> [...]  Add video(s) to tracker (pending status)
  check <videoId>      Check and fetch subtitle for a specific video
  sync                 Check all pending videos
  status               Show status summary
  list [filter]        List videos (filter: pending, fetched, expired, unavailable)
  expire               Mark old pending videos as expired

Examples:
  node subtitle-tracker.js add dQw4w9WgXcQ abc123xyz45
  node subtitle-tracker.js check dQw4w9WgXcQ
  node subtitle-tracker.js sync
  node subtitle-tracker.js list fetched
`);
  }
}

main().catch(console.error);

export { addVideo, addVideos, checkAndFetch, syncAll, showStatus, listVideos };
