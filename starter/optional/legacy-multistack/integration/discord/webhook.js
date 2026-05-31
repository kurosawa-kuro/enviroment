const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

/**
 * Discord webhook にメッセージを送信する
 * @param {string} content - 送信するメッセージ
 * @param {object} options - オプション設定
 * @param {string} options.username - 表示名（オプション）
 * @param {string} options.avatarUrl - アバター画像URL（オプション）
 * @param {Array} options.embeds - 埋め込みメッセージ（オプション）
 */
async function sendMessage(content, options = {}) {
  if (!WEBHOOK_URL) {
    throw new Error('DISCORD_WEBHOOK_URL is required');
  }

  const payload = {
    content,
  };

  if (options.username) {
    payload.username = options.username;
  }

  if (options.avatarUrl) {
    payload.avatar_url = options.avatarUrl;
  }

  if (options.embeds) {
    payload.embeds = options.embeds;
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook error: ${response.status} - ${errorText}`);
  }

  return response;
}

/**
 * 埋め込みメッセージを送信する
 * @param {object} embed - 埋め込みオブジェクト
 */
async function sendEmbed(embed) {
  return sendMessage(null, { embeds: [embed] });
}

// 直接実行時のサンプル
async function main() {
  try {
    // シンプルなメッセージ送信
    await sendMessage('Hello from webhook.js!');
    console.log('メッセージを送信しました');

    // 埋め込みメッセージの例（コメントアウト）
    // await sendEmbed({
    //   title: 'テスト通知',
    //   description: 'これは埋め込みメッセージです',
    //   color: 0x00ff00,
    //   fields: [
    //     { name: 'フィールド1', value: '値1', inline: true },
    //     { name: 'フィールド2', value: '値2', inline: true },
    //   ],
    //   timestamp: new Date().toISOString(),
    // });
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
}

// モジュールとしてエクスポート
module.exports = { sendMessage, sendEmbed, WEBHOOK_URL };

// 直接実行時
if (require.main === module) {
  main();
}
