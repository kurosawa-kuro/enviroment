/**
 * YouTube字幕 意味ブロック分割モジュール
 * Phase 2: ルールベースのセマンティックチャンキング
 */

// トピック境界マーカー（話題転換を示す接続詞・表現）
const TOPIC_BOUNDARY_MARKERS = [
  // 転換
  /^(さて|ところで|では|それでは|次に|続いて|一方で?|他方)/,
  /^(ちなみに|ついでに|余談ですが)/,

  // 対比・逆接
  /^(しかし|けれども?|だが|ただ|でも|とはいえ)/,
  /^(逆に|反対に|むしろ)/,

  // 列挙・追加
  /^(まず|第一に|最初に|一つ目)/,
  /^(次に|第二に|二つ目|そして|また|さらに|加えて)/,
  /^(最後に|最終的に|結局)/,

  // 因果・結論
  /^(だから|したがって|よって|そのため|結果として)/,
  /^(つまり|要するに|結論として|まとめると)/,

  // 例示
  /^(例えば|具体的には|一例として)/,

  // 時間・場面
  /^(その後|それから|以前は|当時は|今は|現在は)/,
  /^(\d{4}年|去年|今年|来年|先月|今月)/,
];

// 文末パターン
const SENTENCE_ENDINGS = /([。！？!?])/;

// 削除対象の短い相槌・フィラー文
const FILLER_SENTENCES = [
  /^[えぇ]ー?[、。！？]?$/,
  /^あー?[。！？]?$/,
  /^うん[。！？]?$/,
  /^はい[。！？]?$/,
  /^ま[ぁあ]?[。！？]?$/,
  /^そう(ですね)?[。！？]?$/,
  /^なるほど[。！？]?$/,
  /^ね[ー～]?[。！？]?$/,
  /^そうそうそう[。！？]?$/,
  /^それは[。！？]?$/,
  /^けど[。！？]?$/,
  /^[。！？]$/,
];

// 意味のある文の最小文字数（句点除く）
const MIN_SENTENCE_LENGTH = 3;

/**
 * テキストを文に分割
 * @param {string} text - 入力テキスト
 * @returns {string[]} 文の配列
 */
export function splitSentences(text) {
  // 改行を一旦スペースに
  const normalized = text.replace(/\n/g, ' ').trim();

  // 句点・疑問符・感嘆符で分割
  const parts = normalized.split(SENTENCE_ENDINGS);

  const sentences = [];
  let current = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (SENTENCE_ENDINGS.test(part)) {
      // 句読点は前の文に結合
      current += part;
      if (current.trim()) {
        sentences.push(current.trim());
      }
      current = '';
    } else {
      current += part;
    }
  }

  // 残りがあれば追加
  if (current.trim()) {
    sentences.push(current.trim());
  }

  // フィラー文・超短文をフィルタリング
  return sentences.filter(sentence => {
    // フィラーパターンに一致する場合は削除
    for (const pattern of FILLER_SENTENCES) {
      if (pattern.test(sentence)) {
        return false;
      }
    }
    // 句点を除いて短すぎる文は削除
    const withoutPunctuation = sentence.replace(/[。！？!?]/g, '');
    if (withoutPunctuation.length <= MIN_SENTENCE_LENGTH) {
      return false;
    }
    return true;
  });
}

/**
 * トピック境界を検出
 * @param {string} sentence - 文
 * @returns {boolean} 境界かどうか
 */
export function isTopicBoundary(sentence) {
  for (const pattern of TOPIC_BOUNDARY_MARKERS) {
    if (pattern.test(sentence)) {
      return true;
    }
  }
  return false;
}

/**
 * 文をグループ化してチャンクを生成
 * @param {string[]} sentences - 文の配列
 * @param {Object} options - オプション
 * @param {number} options.minSentences - 最小文数（デフォルト: 3）
 * @param {number} options.maxSentences - 最大文数（デフォルト: 8）
 * @returns {Array} チャンクの配列
 */
export function groupSentences(sentences, options = {}) {
  const { minSentences = 3, maxSentences = 8 } = options;

  if (sentences.length === 0) {
    return [];
  }

  const chunks = [];
  let currentChunk = [];
  let chunkId = 1;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const isLastSentence = i === sentences.length - 1;
    const isBoundary = isTopicBoundary(sentence);

    // 境界検出時、かつ現在のチャンクが最小サイズ以上
    if (isBoundary && currentChunk.length >= minSentences) {
      // 現在のチャンクを確定
      chunks.push({
        id: chunkId++,
        sentences: [...currentChunk],
        boundaryMarker: null,
      });
      currentChunk = [sentence];
    }
    // 最大サイズに達した場合
    else if (currentChunk.length >= maxSentences) {
      chunks.push({
        id: chunkId++,
        sentences: [...currentChunk],
        boundaryMarker: null,
      });
      currentChunk = [sentence];
    }
    // 通常は追加
    else {
      currentChunk.push(sentence);
    }

    // 最後の文でチャンクが残っている場合
    if (isLastSentence && currentChunk.length > 0) {
      // 小さすぎる場合は前のチャンクに結合
      if (currentChunk.length < minSentences && chunks.length > 0) {
        const lastChunk = chunks[chunks.length - 1];
        lastChunk.sentences.push(...currentChunk);
      } else {
        chunks.push({
          id: chunkId++,
          sentences: currentChunk,
          boundaryMarker: null,
        });
      }
    }
  }

  return chunks;
}

/**
 * チャンクをフォーマット
 * @param {Array} chunks - チャンクの配列
 * @returns {Array} フォーマット済みチャンク
 */
export function formatChunks(chunks) {
  let sentenceIndex = 0;

  return chunks.map(chunk => {
    const text = chunk.sentences.join('');
    const startIndex = sentenceIndex;
    sentenceIndex += chunk.sentences.length;

    // 最初の文からトピックヒントを抽出
    const firstSentence = chunk.sentences[0] || '';
    let topicHint = null;

    for (const pattern of TOPIC_BOUNDARY_MARKERS) {
      const match = firstSentence.match(pattern);
      if (match) {
        topicHint = match[0];
        break;
      }
    }

    return {
      id: chunk.id,
      sentenceCount: chunk.sentences.length,
      startIndex,
      topicHint,
      text,
      sentences: chunk.sentences,
    };
  });
}

/**
 * メイン分割関数
 * @param {string} text - 入力テキスト
 * @param {Object} options - オプション
 * @param {number} options.minSentences - 最小文数（デフォルト: 3）
 * @param {number} options.maxSentences - 最大文数（デフォルト: 8）
 * @returns {Object} 分割結果
 */
export function chunkBySemantics(text, options = {}) {
  const { minSentences = 3, maxSentences = 8 } = options;

  // 1. 文分割
  const sentences = splitSentences(text);

  // 2. グループ化
  const rawChunks = groupSentences(sentences, { minSentences, maxSentences });

  // 3. フォーマット
  const chunks = formatChunks(rawChunks);

  return {
    totalSentences: sentences.length,
    totalChunks: chunks.length,
    options: { minSentences, maxSentences },
    chunks,
  };
}

export default {
  chunkBySemantics,
  splitSentences,
  isTopicBoundary,
  groupSentences,
  formatChunks,
  TOPIC_BOUNDARY_MARKERS,
};
