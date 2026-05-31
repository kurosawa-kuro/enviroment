# Execution Modes (実行モード)

このプロジェクトは **単一コードベースで複数の実行モード** をサポートする設計です。

## 設計方針

従来の「CLI を別フォルダにコピー」ではなく、**runner を追加する** アプローチを採用。

```
job (application)
  ↑
registry
  ↑
runner ←── ここだけ増やす
```

### なぜフォルダ分離しないのか

| 別フォルダ方式 | 問題点 |
|---------------|--------|
| `cp -r workflow-runner cli` | README / tsconfig / package.json が2つになる |
| 同期コスト | 微妙な差分の管理が発生 |
| 最新版どっち？ | 混乱の元 |

| runner 追加方式 | 利点 |
|----------------|------|
| 単一リポジトリ | ドキュメント・設定管理が1箇所 |
| job 共通 | 実行戦略だけが変わる |
| Y字構造 | workflow / CLI が同じ job を使う |

## 現在のアーキテクチャ

```
src/
├── domain/           # ドメイン層
├── application/      # アプリケーション層
│   ├── jobs/         # ★ 両 runner から共有
│   └── job-factory.ts
├── interfaces/       # Port 定義
├── infra/            # インフラ層 (SQLite/pino/yaml)
├── di/               # DI Container
├── registry/         # Job Registry
├── runner/           # ← runner を追加する場所
│   ├── workflow-runner.ts
│   └── types.ts
├── shared/
└── index.ts          # Entry point
```

## 実行モード

### 1. Workflow Runner (default)

全 job を順次実行するモード。現在のデフォルト。

```bash
npm start              # 全 workflow step を実行
npm start -- job-name  # 特定の step を実行
```

### 2. CLI Runner (将来追加)

個別コマンドとして job を実行するモード。

```bash
# 将来のイメージ
RUNNER_MODE=cli npm start -- hello-world
```

## CLI Runner 追加手順

CLI モードが必要になった場合の追加手順:

### Step 1: CLI runner を作成

```typescript
// src/runner/command/cli-runner.ts
import { getJob } from "../../registry/job-registry.js";

export async function runCliCommand(command: string): Promise<void> {
  const job = getJob(command);
  if (!job) {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }

  const result = await job.handler();
  console.log(result.message);
  process.exit(result.success ? 0 : 1);
}
```

### Step 2: index.ts を runner セレクタに

```typescript
// src/index.ts
const mode = process.env.RUNNER_MODE ?? "workflow";

if (mode === "workflow") {
  // 既存の workflow runner
  runWorkflow();
} else if (mode === "cli") {
  // CLI runner
  runCliCommand(process.argv[2]);
}
```

### Step 3: そのまま使えるもの

以下は **変更不要** でそのまま CLI でも使える:

- `application/jobs/*` - 全ての job
- `application/job-factory.ts` - job 作成
- `registry/job-registry.ts` - job 登録・検索
- `di/` - 依存性注入
- `infra/` - SQLite / Logger / Config

## フォルダ分離が必要になるタイミング

以下の条件が **全て揃った** 場合のみ分離を検討:

- CLI が別の npm package として配布される
- CLI 専用の依存関係が大量に増える
- インストール・配布形態が完全に異なる

現状（個人利用・内部基盤・同一依存）では **分離不要**。

## 設計原則

| チェック | 内容 |
|----------|------|
| ✅ | job = application usecase |
| ✅ | runner = 実行戦略（交換可能） |
| ✅ | infra = 完全に沈む |
| ✅ | 単一リポジトリで複数 runner |
| ✅ | job は runner に依存しない |
