/**
 * YouTube字幕テキスト正規化モジュール
 * Phase 1: フィラー削除、誤字修正、短文結合
 */

// デフォルト誤字辞書
export const DEFAULT_TYPO_DICT = {
  // 政治・国際
  "拘速": "拘束",
  "ベネゼエラ": "ベネズエラ",
  "ウクレイナ": "ウクライナ",
  "イスレエル": "イスラエル",
  "パキスタン": "パキスタン",
  "アフガンスタン": "アフガニスタン",

  // 一般的な誤変換
  "けいざい": "経済",
  "せいじ": "政治",
  "ぎいん": "議員",
  "そうり": "総理",
};

// フィラーパターン（行頭・行末・単独）
const FILLER_PATTERNS = [
  // 行頭フィラー
  /^[えぇ]ー?[、,]?\s*/,
  /^あの[ー～]?[、,]?\s*/,
  /^その[ー～]?[、,]?\s*/,
  /^ま[ぁあ]?[、,]?\s*/,
  /^うん[、,]?\s*/,
  /^えーと[、,]?\s*/,
  /^えっと[、,]?\s*/,
  /^なんか[、,]?\s*/,
  /^こう[、,]?\s*/,
  /^やっぱ[り]?[、,]?\s*/,

  // 行末フィラー
  /[、,]?\s*ね[ー～]?$/,
  /[、,]?\s*よね$/,
  /[、,]?\s*かな$/,
];

// 単独フィラー行（削除対象）- 句点付きも対応
const STANDALONE_FILLERS = [
  /^[えぇ]ー?[。！？]?$/,
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
  /^[。！？]$/,  // 句点のみ
];

// 超短文の最小文字数（これ以下は削除）
const MIN_MEANINGFUL_LENGTH = 3;

/**
 * フィラーを削除
 * @param {string} text - 入力テキスト
 * @returns {{ text: string, removedCount: number }}
 */
export function removeFiller(text) {
  let removedCount = 0;
  const lines = text.split('\n');

  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    // 単独フィラー行は削除
    for (const pattern of STANDALONE_FILLERS) {
      if (pattern.test(trimmed)) {
        removedCount++;
        return null;
      }
    }

    // 超短文は削除（句点除いて3文字以下）
    const withoutPunctuation = trimmed.replace(/[。！？!?]/g, '');
    if (withoutPunctuation.length <= MIN_MEANINGFUL_LENGTH) {
      removedCount++;
      return null;
    }

    // 行頭・行末フィラーを削除
    let processed = trimmed;
    for (const pattern of FILLER_PATTERNS) {
      const before = processed;
      processed = processed.replace(pattern, '');
      if (before !== processed) {
        removedCount++;
      }
    }

    return processed;
  }).filter(line => line !== null && line.length > 0);

  return {
    text: processedLines.join('\n'),
    removedCount
  };
}

/**
 * 短文を前後の行と結合
 * @param {string} text - 入力テキスト
 * @param {number} minLength - 最小文字数（デフォルト: 5）
 * @returns {string}
 */
export function mergeShortLines(text, minLength = 5) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  if (lines.length <= 1) {
    return text;
  }

  const merged = [];
  let buffer = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (buffer) {
      // バッファがある場合は結合
      buffer += trimmed;

      if (buffer.length >= minLength) {
        merged.push(buffer);
        buffer = '';
      }
    } else if (trimmed.length < minLength) {
      // 短い行はバッファに
      buffer = trimmed;
    } else {
      merged.push(trimmed);
    }
  }

  // 残りのバッファを処理
  if (buffer) {
    if (merged.length > 0) {
      merged[merged.length - 1] += buffer;
    } else {
      merged.push(buffer);
    }
  }

  return merged.join('\n');
}

/**
 * 誤字を辞書で修正
 * @param {string} text - 入力テキスト
 * @param {Object} dictionary - 誤字辞書
 * @returns {{ text: string, fixedCount: number, fixes: Array }}
 */
export function fixTypos(text, dictionary = DEFAULT_TYPO_DICT) {
  let result = text;
  let fixedCount = 0;
  const fixes = [];

  for (const [typo, correct] of Object.entries(dictionary)) {
    const regex = new RegExp(typo, 'g');
    const matches = result.match(regex);

    if (matches) {
      fixes.push({ from: typo, to: correct, count: matches.length });
      fixedCount += matches.length;
      result = result.replace(regex, correct);
    }
  }

  return { text: result, fixedCount, fixes };
}

/**
 * 空白・改行を正規化
 * @param {string} text - 入力テキスト
 * @returns {string}
 */
export function normalizeWhitespace(text) {
  return text
    // 全角スペースを半角に
    .replace(/　/g, ' ')
    // 連続空白を1つに
    .replace(/ +/g, ' ')
    // 連続改行を1つに
    .replace(/\n{3,}/g, '\n\n')
    // 行頭・行末の空白を除去
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * メイン正規化関数
 * @param {string} text - 入力テキスト
 * @param {Object} options - オプション
 * @param {boolean} options.removeFiller - フィラー削除（デフォルト: true）
 * @param {boolean} options.mergeShort - 短文結合（デフォルト: true）
 * @param {number} options.minLength - 短文判定文字数（デフォルト: 5）
 * @param {boolean} options.fixTypos - 誤字修正（デフォルト: true）
 * @param {Object} options.typoDictionary - カスタム誤字辞書
 * @returns {Object} 正規化結果
 */
export function normalizeSubtitle(text, options = {}) {
  const {
    removeFiller: doRemoveFiller = true,
    mergeShort = true,
    minLength = 5,
    fixTypos: doFixTypos = true,
    typoDictionary = DEFAULT_TYPO_DICT,
  } = options;

  const originalLength = text.length;
  let result = text;
  let stats = {
    originalLength,
    removedFillers: 0,
    fixedTypos: 0,
    typoFixes: [],
  };

  // 1. 空白正規化
  result = normalizeWhitespace(result);

  // 2. フィラー削除
  if (doRemoveFiller) {
    const fillerResult = removeFiller(result);
    result = fillerResult.text;
    stats.removedFillers = fillerResult.removedCount;
  }

  // 3. 誤字修正
  if (doFixTypos) {
    const typoResult = fixTypos(result, typoDictionary);
    result = typoResult.text;
    stats.fixedTypos = typoResult.fixedCount;
    stats.typoFixes = typoResult.fixes;
  }

  // 4. 短文結合
  if (mergeShort) {
    result = mergeShortLines(result, minLength);
  }

  // 5. 最終正規化
  result = normalizeWhitespace(result);

  return {
    text: result,
    normalizedLength: result.length,
    ...stats,
  };
}

export default {
  normalizeSubtitle,
  removeFiller,
  mergeShortLines,
  fixTypos,
  normalizeWhitespace,
  DEFAULT_TYPO_DICT,
};
