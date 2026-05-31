# Playwright Integration Tools

Playwright を使用した自動化ツール集

## セットアップ

```bash
make install
cp .env.example .env
# .env を編集してAPIキーを設定
```

## フォルダ構造

```
playwright/
├── src/
│   ├── ai/              # AI/LLM連携
│   │   ├── simple-chat.js
│   │   ├── chat.js
│   │   ├── analyze-transcript.js
│   │   └── risk-decision.js
│   ├── subtitle/        # 字幕処理
│   │   ├── processor.js
│   │   ├── chunker.js
│   │   ├── normalizer.js
│   │   ├── tracker.js
│   │   └── youtube.js
│   └── scraper/         # スクレイピング
│       └── fetch-sample.js
├── output/              # 出力データ
├── data/                # 入力データ
└── Makefile
```

## クイックリファレンス

```bash
make              # ヘルプ表示
make install      # 依存関係インストール
make chat         # 対話チャット
make analyze      # トランスクリプト分析
make decide       # リスク判定
make process FILE=data/output/xxx_subtitle.json  # 字幕フル処理
```

---

## OpenAI / DeepSeek Chatbot

JavaScript chatbot with OpenAI and DeepSeek support.

### プロバイダー切り替え

`.env` を編集:
```
PROVIDER=openai    # or deepseek
```

または環境変数で指定:
```bash
PROVIDER=deepseek make start
```

### コマンド

```bash
# 単発メッセージ
make start

# 対話モード
make chat

# Playwrightでページ取得サンプル
make fetch
```

### サポートモデル

| Provider | Model |
|----------|-------|
| OpenAI   | gpt-4o-mini |
| DeepSeek | deepseek-chat |

---

## 字幕テキスト処理ツール

YouTube自動字幕の後処理ツール。

### Phase 1: 正規化（Normalization）

フィラー削除、誤字修正、短文結合を行います。

```bash
# 正規化のみ
make normalize FILE=data/output/xxx_subtitle.json

# オプション: 出力先指定
node src/subtitle/processor.js normalize input.json --output output.json
```

**処理内容:**
- フィラー削除: `え、` `あの` `うん` `ま、` `えーと` 等
- 短文結合: 5文字以下の行を前後と結合
- 誤字修正: 辞書ベースの置換
- 空白正規化: 連続空白・改行の整理

### Phase 2: 意味ブロック分割（Chunking）

接続詞・トピックマーカーで意味単位に分割します。

```bash
# チャンキングのみ
make chunk FILE=data/output/xxx_normalized.json

# オプション: 最小・最大文数指定
node src/subtitle/processor.js chunk input.json --min 3 --max 8
```

### フル処理（推奨）

正規化 + チャンキングを連続実行します。

```bash
make process FILE=data/output/xxx_subtitle.json
```

### 出力ファイル

| ファイル | 内容 |
|----------|------|
| `*_normalized.json` | 正規化済みテキスト + 統計情報 |
| `*_chunked.json` | 意味ブロック分割結果 |

### カスタマイズ

**誤字辞書の追加** (`src/subtitle/normalizer.js`):
```javascript
export const DEFAULT_TYPO_DICT = {
  "拘速": "拘束",
  "ベネゼエラ": "ベネズエラ",
  // カスタム追加
};
```

**トピックマーカーの追加** (`src/subtitle/chunker.js`):
```javascript
const TOPIC_BOUNDARY_MARKERS = [
  /^(さて|ところで|では)/,
  // カスタム追加
];
```
