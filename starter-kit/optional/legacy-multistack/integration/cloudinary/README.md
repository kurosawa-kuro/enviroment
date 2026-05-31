# Cloudinary Node.js Starter

Node.js 単体で Cloudinary API を扱うミニ・スターター。

## 機能

- ローカル画像のアップロード
- URL からのアップロード
- フォルダ内画像の一覧取得
- Query 検索（Lucene 構文）
- 画像削除（単体・一括・フォルダ）
- `.env` で Cloudinary を設定
- Next.js や Lambda への移植が簡単

## クイックスタート

```bash
# 環境変数を設定
cp .env.example .env
# .env を編集して Cloudinary の認証情報を設定

# 依存関係インストール
npm install

# デモ実行（Upload → List → Search → Delete）
npm start
```

## Cloudinary 認証情報の取得

1. [Cloudinary Console](https://console.cloudinary.com/) にログイン
2. Settings → API Keys に移動
3. Cloud Name, API Key, API Secret をコピー
4. `.env` に設定

## プロジェクト構成

```
cloudinary/
├── src/
│   ├── config.js    # Cloudinary 設定
│   ├── upload.js    # アップロード機能
│   ├── list.js      # 一覧取得機能
│   ├── search.js    # 検索機能
│   ├── delete.js    # 削除機能
│   └── index.js     # デモ実行
├── .env.example
├── package.json
└── README.md
```

## API リファレンス

### upload.js

```js
import { uploadFile, uploadFromUrl } from "./src/upload.js";

// ローカルファイルをアップロード
const result = await uploadFile("./image.png", "folder-name");

// URL からアップロード
const result = await uploadFromUrl("https://example.com/image.jpg", "folder-name");
```

### list.js

```js
import { listImages, listAllResources, listFolders } from "./src/list.js";

// フォルダ内の画像一覧
const images = await listImages("folder-name", 30);

// すべてのリソース
const resources = await listAllResources("image", 30);

// フォルダ一覧
const folders = await listFolders();
```

### search.js

```js
import { searchImages, searchByTag, searchByFormat } from "./src/search.js";

// Lucene クエリで検索
const results = await searchImages("folder:starter AND format:png");

// タグで検索
const results = await searchByTag("profile");

// フォーマットで検索
const results = await searchByFormat("webp");
```

**検索クエリ例:**

| クエリ | 説明 |
|-------|------|
| `folder:starter` | フォルダ内の画像 |
| `public_id:starter/sample` | 特定の画像 |
| `format:png` | PNG 画像 |
| `created_at>[2024-01-01]` | 2024年以降 |
| `bytes>1000000` | 1MB 以上 |
| `width>1000 AND height>1000` | 1000px 以上 |
| `tags=profile` | タグ付き |

### delete.js

```js
import { deleteImage, deleteMultiple, deleteByFolder } from "./src/delete.js";

// 単体削除
await deleteImage("folder/image-id");

// 一括削除
await deleteMultiple(["id1", "id2", "id3"]);

// フォルダ内全削除
await deleteByFolder("folder-name");
```

## Next.js への統合

このスターターは Next.js の Utility として移植できます：

```
/lib/cloudinary/
├── config.ts
├── upload.ts
├── list.ts
├── search.ts
└── delete.ts
```

```ts
// app/api/upload/route.ts
import { uploadFile } from "@/lib/cloudinary/upload";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  // ...
}
```

## Lambda への統合

Lambda batch として使用する場合：

```js
// Lambda Handler
export async function handler(event) {
  const { uploadFile } = await import("./upload.js");
  const result = await uploadFile(event.filePath, "uploads");
  return { statusCode: 200, body: JSON.stringify(result) };
}
```

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `CLOUDINARY_CLOUD_NAME` | Cloud Name |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

## リソースタイプ

| タイプ | 説明 |
|--------|------|
| `image` | 画像ファイル（デフォルト） |
| `video` | 動画ファイル |
| `raw` | その他のファイル（PDF など） |
| `auto` | 自動判定 |
