# 動画ファイル整理ツール

指定されたディレクトリ内の動画ファイルを検索し、整理するためのNode.jsツールです。

## 機能

- 指定ディレクトリ内の動画ファイルを再帰的に検索
- 動画ファイルの詳細情報（サイズ、作成日時、更新日時）を取得
- 特定のディレクトリを検索対象から除外
- ファイル情報をJSON形式で表示

## 対応フォーマット

以下の動画ファイル形式に対応しています：
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- WMV (.wmv)
- MKV (.mkv)
- TS (.ts)

## 必要条件

- Node.js (v12.0.0以上)
- Windows OS

## セットアップ

1. リポジトリをクローン
```bash
git clone [repository-url]
cd starter-kit-renamer
```

2. 依存関係のインストール
```bash
npm install
```

## 使用方法

1. 設定の確認
`src/main.js`の以下の定数を必要に応じて変更：
```javascript
const TARGET_DIR = 'C:\\Users\\owner\\Downloads\\Video';  // 検索対象ディレクトリ
const EXCLUDED_DIRS = [                                    // 除外ディレクトリ
    path.join(TARGET_DIR, 'snagit')
];
```

2. スクリプトの実行
```bash
node src/main.js
```

## 出力例

```
動画ファイルの検索を開始します...
除外対象ディレクトリをスキップします: C:\Users\owner\Downloads\Video\snagit

検出された動画ファイル:
{
  "fileName": "example.mp4",
  "extension": ".mp4",
  "size": "156.78 MB",
  "createdTime": "2024/3/15 10:30:45",
  "modifiedTime": "2024/3/15 10:35:22",
  "to": "",
  "category": ""
}

処理が完了しました。
合計 1 個の動画ファイルを検出しました。
```

## ファイル情報

各動画ファイルの情報には以下の項目が含まれます：
- `fileName`: ファイル名
- `extension`: 拡張子
- `size`: ファイルサイズ（MB）
- `createdTime`: 作成日時
- `modifiedTime`: 更新日時
- `to`: 移動先ディレクトリ（予定）
- `category`: カテゴリ（予定）

## 注意事項

- 大容量のディレクトリを検索する場合は、処理に時間がかかる可能性があります
- 除外ディレクトリは大文字小文字を区別しません
- ファイルの移動機能は現在コメントアウトされています

## 今後の予定

- [ ] ファイル移動機能の実装
- [ ] カテゴリ分類機能の追加
- [ ] 設定ファイルの外部化
- [ ] 進捗表示の改善
- [ ] エラーハンドリングの強化

## ライセンス

MIT License