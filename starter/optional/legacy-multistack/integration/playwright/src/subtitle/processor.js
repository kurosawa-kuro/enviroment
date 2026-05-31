#!/usr/bin/env node
/**
 * YouTube字幕処理 統合CLI
 *
 * Usage:
 *   node subtitle-processor.js normalize <input.json> [--output <output.json>]
 *   node subtitle-processor.js chunk <input.json> [--min 3] [--max 8] [--output <output.json>]
 *   node subtitle-processor.js full <input.json> [--output-dir <dir>]
 */

import fs from 'fs';
import path from 'path';
import { normalizeSubtitle } from './normalizer.js';
import { chunkBySemantics } from './chunker.js';

const DEFAULT_OUTPUT_DIR = './data/output';

/**
 * 入力ファイルを読み込み
 * @param {string} inputPath - 入力ファイルパス
 * @returns {Object} パース済みJSON
 */
function readInput(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 結果を保存
 * @param {string} outputPath - 出力ファイルパス
 * @param {Object} data - 保存するデータ
 */
function saveOutput(outputPath, data) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved: ${outputPath}`);
}

/**
 * 入力からテキストを抽出
 * @param {Object} input - 入力データ
 * @returns {{ text: string, videoId: string | null }}
 */
function extractText(input) {
  // subtitle.json形式
  if (input.plainText) {
    return {
      text: input.plainText,
      videoId: input.videoId || null,
      title: input.title || null,
    };
  }

  // normalized.json形式
  if (input.text) {
    return {
      text: input.text,
      videoId: input.videoId || null,
      title: input.title || null,
    };
  }

  // プレーンテキスト
  if (typeof input === 'string') {
    return {
      text: input,
      videoId: null,
      title: null,
    };
  }

  throw new Error('Unknown input format. Expected plainText or text field.');
}

/**
 * normalize コマンド
 */
function cmdNormalize(args) {
  const inputPath = args[0];
  if (!inputPath) {
    console.error('Usage: normalize <input.json> [--output <output.json>]');
    process.exit(1);
  }

  const outputIndex = args.indexOf('--output');
  let outputPath = null;
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputPath = args[outputIndex + 1];
  }

  const input = readInput(inputPath);
  const { text, videoId, title } = extractText(input);

  console.log(`Normalizing: ${inputPath}`);
  console.log(`Original length: ${text.length} chars`);

  const result = normalizeSubtitle(text);

  const output = {
    videoId,
    title,
    originalLength: result.originalLength,
    normalizedLength: result.normalizedLength,
    removedFillers: result.removedFillers,
    fixedTypos: result.fixedTypos,
    typoFixes: result.typoFixes,
    text: result.text,
  };

  console.log(`Normalized length: ${result.normalizedLength} chars`);
  console.log(`Removed fillers: ${result.removedFillers}`);
  console.log(`Fixed typos: ${result.fixedTypos}`);

  if (!outputPath) {
    // デフォルト出力パス
    const basename = path.basename(inputPath, '.json');
    const videoIdPart = videoId ? `${videoId}_` : '';
    outputPath = path.join(
      DEFAULT_OUTPUT_DIR,
      `${videoIdPart}${basename.replace('_subtitle', '')}_normalized.json`
    );
  }

  saveOutput(outputPath, output);
  return output;
}

/**
 * chunk コマンド
 */
function cmdChunk(args) {
  const inputPath = args[0];
  if (!inputPath) {
    console.error('Usage: chunk <input.json> [--min 3] [--max 8] [--output <output.json>]');
    process.exit(1);
  }

  // オプション解析
  const minIndex = args.indexOf('--min');
  const maxIndex = args.indexOf('--max');
  const outputIndex = args.indexOf('--output');

  const minSentences = minIndex !== -1 ? parseInt(args[minIndex + 1], 10) : 3;
  const maxSentences = maxIndex !== -1 ? parseInt(args[maxIndex + 1], 10) : 8;
  let outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  const input = readInput(inputPath);
  const { text, videoId, title } = extractText(input);

  console.log(`Chunking: ${inputPath}`);
  console.log(`Min sentences: ${minSentences}, Max sentences: ${maxSentences}`);

  const result = chunkBySemantics(text, { minSentences, maxSentences });

  const output = {
    videoId,
    title,
    totalSentences: result.totalSentences,
    totalChunks: result.totalChunks,
    options: result.options,
    chunks: result.chunks,
  };

  console.log(`Total sentences: ${result.totalSentences}`);
  console.log(`Total chunks: ${result.totalChunks}`);

  if (!outputPath) {
    const basename = path.basename(inputPath, '.json');
    const videoIdPart = videoId ? `${videoId}_` : '';
    outputPath = path.join(
      DEFAULT_OUTPUT_DIR,
      `${videoIdPart}${basename.replace('_subtitle', '').replace('_normalized', '')}_chunked.json`
    );
  }

  saveOutput(outputPath, output);
  return output;
}

/**
 * full コマンド（normalize + chunk）
 */
function cmdFull(args) {
  const inputPath = args[0];
  if (!inputPath) {
    console.error('Usage: full <input.json> [--output-dir <dir>]');
    process.exit(1);
  }

  const outputDirIndex = args.indexOf('--output-dir');
  const outputDir = outputDirIndex !== -1 ? args[outputDirIndex + 1] : DEFAULT_OUTPUT_DIR;

  const input = readInput(inputPath);
  const { text, videoId, title } = extractText(input);

  console.log('=== Phase 1: Normalize ===');
  const normalizeResult = normalizeSubtitle(text);

  console.log(`Original: ${normalizeResult.originalLength} chars`);
  console.log(`Normalized: ${normalizeResult.normalizedLength} chars`);
  console.log(`Removed fillers: ${normalizeResult.removedFillers}`);
  console.log(`Fixed typos: ${normalizeResult.fixedTypos}`);

  console.log('\n=== Phase 2: Chunk ===');
  const chunkResult = chunkBySemantics(normalizeResult.text);

  console.log(`Total sentences: ${chunkResult.totalSentences}`);
  console.log(`Total chunks: ${chunkResult.totalChunks}`);

  // 出力ファイル名生成
  const videoIdPart = videoId ? `${videoId}_` : '';

  // normalized.json 保存
  const normalizedOutput = {
    videoId,
    title,
    originalLength: normalizeResult.originalLength,
    normalizedLength: normalizeResult.normalizedLength,
    removedFillers: normalizeResult.removedFillers,
    fixedTypos: normalizeResult.fixedTypos,
    typoFixes: normalizeResult.typoFixes,
    text: normalizeResult.text,
  };
  const normalizedPath = path.join(outputDir, `${videoIdPart}normalized.json`);
  saveOutput(normalizedPath, normalizedOutput);

  // chunked.json 保存
  const chunkedOutput = {
    videoId,
    title,
    totalSentences: chunkResult.totalSentences,
    totalChunks: chunkResult.totalChunks,
    options: chunkResult.options,
    chunks: chunkResult.chunks,
  };
  const chunkedPath = path.join(outputDir, `${videoIdPart}chunked.json`);
  saveOutput(chunkedPath, chunkedOutput);

  console.log('\n=== Summary ===');
  console.log(`Normalized: ${normalizedPath}`);
  console.log(`Chunked: ${chunkedPath}`);

  return { normalizedOutput, chunkedOutput };
}

/**
 * ヘルプ表示
 */
function showHelp() {
  console.log(`
YouTube字幕処理ツール

Usage:
  node subtitle-processor.js <command> <input> [options]

Commands:
  normalize  正規化（フィラー削除、誤字修正、短文結合）
  chunk      意味ブロック分割
  full       normalize + chunk を連続実行

Options:
  --output <path>      出力ファイルパス
  --output-dir <dir>   出力ディレクトリ（fullコマンド用）
  --min <n>            最小文数（chunkコマンド、デフォルト: 3）
  --max <n>            最大文数（chunkコマンド、デフォルト: 8）

Examples:
  node subtitle-processor.js normalize data/output/xxx_subtitle.json
  node subtitle-processor.js chunk data/output/xxx_normalized.json --min 3 --max 8
  node subtitle-processor.js full data/output/xxx_subtitle.json
`);
}

// メイン
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'normalize':
    cmdNormalize(args);
    break;
  case 'chunk':
    cmdChunk(args);
    break;
  case 'full':
    cmdFull(args);
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
