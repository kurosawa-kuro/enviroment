# Workflow Runner

**job を順序実行する workflow-runner の基準実装**

TypeScript で書かれたワークフロー実行エンジン。cron や Lambda など外部オーケストレーターから呼び出されることを想定。

## 用語

| 用語 | 定義 |
|------|------|
| **Job** | 単一のワークフローステップ (実行単位) |
| **Workflow** | Job の順序付きリスト |
| **Runner** | ワークフローを決定的に実行するエンジン |

## コンセプト

### workflow-runner とは

このプロジェクトは「バッチジョブ実行ツール」ではなく **workflow-runner** です。

```
┌─────────────────────────────────────────────────────────────┐
│  External Orchestrator (cron, Lambda, Step Functions)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Workflow Runner (this project)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   job A     │──│   job B     │──│   job C     │        │
│  │ (step 1)    │  │ (step 2)    │  │ (step 3)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### job = workflow step

**job は workflow step** です：

- job は単体で実行されない（runner を通して呼ばれる）
- job は順序・再実行・状態を持たない
- job は「入力 → 処理 → 終了」だけを担当

### やらないこと

Workflow Runner は以下を **意図的にやりません**：

- ❌ 並列実行
- ❌ リトライロジック
- ❌ スキップ判断
- ❌ 対話的プロンプト
- ❌ CLI コマンドフレームワーク

複雑なワークフローは外部オーケストレーター（Step Functions、Airflow など）で制御します。

## セットアップ

```bash
# 依存関係のインストール
make install
# または
npm install

# データベース初期化
npm run db-init
```

## 実行モード

`env/config.yaml` の `runnerMode` で切り替え:

| モード | 説明 | 用途 |
|--------|------|------|
| `workflow` | 全 job を順次実行 (default) | バッチ処理 |
| `cli` | 単一 job をコマンドとして実行 | 対話・デバッグ |

```yaml
# env/config.yaml
runnerMode: workflow  # または cli
```

環境変数 `RUNNER_MODE` でもオーバーライド可能。

## 利用可能なワークフローステップ

| ジョブ名 | 説明 | 推奨スケジュール |
|----------|------|------------------|
| hello-world | サンプルジョブ | - |
| db-init | SQLite データベース初期化・マイグレーション | 初回のみ |
| item-crud | Item CRUD 操作デモ | 1日1回 (0 0 * * *) |

```bash
# ワークフローステップ一覧を表示
npm start -- --help
```

## コマンド

```bash
# 全ワークフローを実行
npm start

# 特定ステップのみ実行
npm start -- hello-world

# 開発モード (ホットリロード)
make dev

# ビルド
make build

# テスト
make test
```

## ワークフローステップの実行方法

### 直接実行

```bash
# npm script 経由 (開発用)
npm run hello-world
npm run db-init
npm run item-crud

# Runner 経由 (レジストリ使用)
npm start -- hello-world
npm start -- db-init
npm start -- item-crud
```

> **Note:** `npm run <job>` スクリプトは開発・テスト用です。本番では Runner 経由 (`npm start`) または PM2 を使用してください。

### CLI モードで実行

```bash
# 環境変数でモード切替
RUNNER_MODE=cli npm start -- hello-world

# または config.yaml で runnerMode: cli に設定
npm start -- hello-world
```

### Doppler 経由 (クレデンシャル使用時)

```bash
# Doppler からシークレットを注入して実行
doppler run -- npm start
doppler run -- npm start -- item-crud
```

## PM2 (本番運用)

PM2 を使用した本番環境でのワークフロー実行:

```bash
# PM2 インストール (未インストールの場合)
npm install -g pm2

# ワークフロー開始
make pm2-start

# 特定ジョブのみ開始
make pm2-start-job JOB=item-crud

# ステータス確認
make pm2-status

# ログ確認
make pm2-logs

# 停止
make pm2-stop

# Doppler + PM2
make pm2-doppler
```

## 新しいワークフローステップの追加

### 基本的なステップ (DI なし)

`src/application/jobs/<category>/` に新しいファイルを作成:

```typescript
import "../../../infra/config/yaml.js";
import { createJob } from "../../job-factory.js";
import { registerJob } from "../../../registry/job-registry.js";
import { runIfMain } from "../../../runner/workflow-runner.js";

export const myJob = createJob(
  {
    name: "my-job",
    description: "My workflow step",
    schedule: "0 9 * * *", // Optional: 推奨スケジュール（情報のみ）
  },
  async (ctx, logger) => {
    logger.info("Step started");
    // ここに処理を実装
    return {
      success: true,
      message: "Step completed successfully",
    };
  }
);

registerJob(myJob);
export const main = myJob.handler;
runIfMain(main, import.meta.url);
```

### DI 対応ステップ (テスト容易性向上)

外部依存がある場合は `createJobWithDeps` を使用:

```typescript
import "../../../infra/config/yaml.js";
import { createJobWithDeps } from "../../job-factory.js";
import { registerJob } from "../../../registry/job-registry.js";
import { runIfMain } from "../../../runner/workflow-runner.js";

export const myJob = createJobWithDeps(
  {
    name: "my-job",
    description: "My DI-enabled workflow step",
    schedule: "0 9 * * *",
  },
  async (_ctx, logger, deps) => {
    const { config, itemRepo } = deps;

    const items = itemRepo.list();
    logger.info({ count: items.length }, "Items loaded");

    return {
      success: true,
      message: "Step completed successfully",
      metrics: { itemCount: items.length },
    };
  }
);

registerJob(myJob);
export const main = myJob.handler;
runIfMain(main, import.meta.url);
```

### ステップ登録手順

1. `src/application/jobs/index.ts` にエクスポートを追加:

```typescript
export { myJob, main as myJobMain } from "./<category>/my-job.js";
```

2. `package.json` に script を追加:

```json
{
  "scripts": {
    "my-job": "tsx src/application/jobs/<category>/my-job.ts"
  }
}
```

## ディレクトリ構成 (Clean Architecture)

```
workflow-runner/
├── src/
│   ├── domain/                         # ドメイン層
│   │   ├── entities/
│   │   │   └── item.ts                 # エンティティ
│   │   └── repositories/
│   │       └── item.ts                 # Repository Interface (Port)
│   │
│   ├── application/                    # アプリケーション層
│   │   ├── jobs/                       # ワークフローステップ (UseCase)
│   │   │   ├── index.ts
│   │   │   ├── system/
│   │   │   │   └── hello-world.ts
│   │   │   └── database/
│   │   │       ├── db-init.ts
│   │   │       └── item-crud.ts
│   │   └── job-factory.ts              # Job 作成ファクトリ
│   │
│   ├── interfaces/                     # Port 定義層
│   │   ├── clock.ts                    # Clock Port
│   │   ├── config.ts                   # Config Port
│   │   └── logger.ts                   # Logger Port
│   │
│   ├── infra/                          # インフラ層
│   │   ├── database/
│   │   │   ├── clients/
│   │   │   │   └── sqlite.ts           # SQLite クライアント
│   │   │   └── errors.ts
│   │   ├── repositories/
│   │   │   └── item/
│   │   │       └── sqlite.ts           # Repository 実装
│   │   ├── logger/
│   │   │   └── pino.ts                 # pino Logger 実装
│   │   ├── clock/
│   │   │   └── system.ts               # System Clock 実装
│   │   └── config/
│   │       └── yaml.ts                 # YAML Config 実装
│   │
│   ├── di/                             # DI Container (Awilix)
│   │   ├── container.ts
│   │   ├── types.ts
│   │   ├── mocks.ts                    # テスト用モック
│   │   └── index.ts
│   │
│   ├── runner/                         # Runner 層
│   │   ├── workflow-runner.ts
│   │   └── types.ts                    # JobResult 型
│   │
│   ├── registry/                       # Job Registry
│   │   └── job-registry.ts
│   │
│   ├── shared/                         # 共通ユーティリティ
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   ├── db/
│   │   └── migrations/
│   │       └── 001_init.sql
│   │
│   └── index.ts                        # Entry point (Runner セレクタ)
│
├── test/
│   ├── helpers/
│   │   └── index.ts
│   ├── job-factory.test.ts
│   ├── hello-world.test.ts
│   ├── db-init.test.ts
│   └── item-crud.test.ts
│
├── data/
│   └── workflow-runner.db                        # SQLite データベース
│
├── env/
│   └── config.yaml                     # プロジェクト設定
│
├── ecosystem.config.cjs                # PM2 設定
├── doppler.yaml                        # Doppler 設定
└── README-CLI.md                       # CLI モード詳細
```

## 設定

### config.yaml (プロジェクト設定)

`env/config.yaml` にプロジェクト固有の設定を記述:

```yaml
# アプリケーション設定
projectName: workflow-runner
appEnv: local
logLevel: debug
dbPath: data/workflow-runner.db

# 実行モード: workflow | cli
runnerMode: workflow
```

### Doppler (クレデンシャル)

DB 接続や API キーなどのクレデンシャルは Doppler で管理:

```bash
# セットアップ (DOPPLER_TOKEN 必要)
make doppler-setup

# Doppler 経由で実行
make doppler-run
```

| 環境変数 | 説明 |
|----------|------|
| DATABASE_URL | 外部 DB 接続文字列 |
| API_KEY | 外部 API キー |
| RUNNER_MODE | 実行モード (workflow/cli) |

## アーキテクチャ

### Clean Architecture 構成

```
┌─────────────────────────────────────────────────────────────┐
│                      index.ts (Entry)                       │
│                   Runner Selector (mode)                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    Workflow Runner      │     │      CLI Runner         │
│   (全 job 順次実行)      │     │   (単一 job 実行)        │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Job Registry                           │
│                (name → implementation mapping)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    application/jobs/                        │
│                   (UseCase = Job 定義)                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│    domain/      │  │ interfaces/ │  │     infra/      │
│  (Entity/Port)  │  │   (Port)    │  │ (Adapter/実装)  │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

### 責務分担

| コンポーネント | 責務 | やらないこと |
|----------------|------|--------------|
| **Registry** | name → job mapping | 実行、依存解決、状態管理 |
| **Runner** | 順序実行、exit code | 並列、retry、skip、対話 |
| **Job Factory** | job 作成、DI 配線、計測 | ワークフロー制御、再実行判断 |
| **Job (Step)** | 入力 → 処理 → 結果 | 他 job との連携、状態保持 |

### 依存性注入 (DI)

Awilix を使用した DI コンテナ:

```typescript
interface Dependencies {
  clock: Clock;                       // 時刻取得
  executionId: ExecutionIdGenerator;  // 実行ID生成
  config: ConfigProvider;             // 設定取得
  db: Database;                       // SQLite 接続
  itemRepo: ItemRepository;           // Item リポジトリ
}
```

テスト時はモックに差し替え可能:

```typescript
import { createTestContainer, createMockItemRepo } from "./helpers/index.js";

const container = createTestContainer({
  itemRepo: createMockItemRepo(),
});
const result = await myJob.handler(container);
```

### JobResult 型

すべてのワークフローステップは統一された `JobResult` 型を返します:

```typescript
interface JobResult {
  success: boolean;
  message: string;
  executedAt: Date;
  duration: number;
  metrics?: Record<string, number>;
  details?: Record<string, unknown>;
}
```

## ログ

pino を使用した構造化ログ出力:
- 開発環境: pino-pretty による整形出力
- 本番環境: JSON 形式

```bash
# ログレベルを変更して実行
LOG_LEVEL=debug npm start
```

ログには自動的に以下が含まれます:
- `job`: ジョブ名
- `executionId`: 実行 ID (トレーシング用)

## テスト

Vitest + Awilix DI モックによるテスト:

```bash
# テスト実行
npm test

# ウォッチモード
npm run test:watch
```

### テストヘルパー

```typescript
import {
  createTestContainer,
  createMockConfig,
  createMockItemRepo,
} from "./helpers/index.js";

// 基本的なテストコンテナ
const container = createTestContainer();

// カスタム設定でテスト
const container = createTestContainer({
  config: createMockConfig({ dbPath: ":memory:" }),
});

// Item リポジトリモック
const container = createTestContainer({
  itemRepo: createMockItemRepo(),
});

const result = await myJob.handler(container);
expect(result.success).toBe(true);
```

## CLI モード詳細

CLI モード (単一 job をコマンドとして実行) の詳細については [README-CLI.md](./README-CLI.md) を参照。
