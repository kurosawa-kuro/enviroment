import { z } from 'zod'

// 環境変数の文字列 "true"/"false" を正しくブール値に変換
const envBoolean = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true'
  }
  return Boolean(val)
}, z.boolean())

export const appConfigSchema = z.object({
  // ① 実行モード / 環境制御（最上位）
  appEnv: z.enum(['local', 'development', 'production']).default('local'),
  appMode: z.enum(['origin', 'stable']).default('origin'),

  // ② サーバー / アプリ基本設定
  projectName: z.string().default('starter'),
  port: z.coerce.number().default(8001),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  rateLimitPerMinute: z.coerce.number().default(100),

  // ③ 認証・認可（Clerk / 内部API）
  authEnabled: envBoolean.default(false),
  authJwtSecret: z.string().default(''),
  authClerkPublishableKey: z.string().default(''),
  authClerkSecretKey: z.string().default(''),

  // ③-2 内部通知API
  notifyInternalApiUrl: z.string().default(''),
  notifyInternalApiKey: z.string().default(''),

  // ④ データベース
  dbMongodbUri: z.string().default('mongodb://localhost:27017/starter'),
  dbNeonUri: z.string().default(''),
  mongoDbName: z.string().default('starter'),

  // ⑤ AWS（Read / 管理系）
  awsAccessKeyId: z.string().default(''),
  awsSecretAccessKey: z.string().default(''),
  awsRegion: z.string().default('ap-northeast-1'),

  // ⑥ GitHub / CI・自動化
  gitGithubAccessToken: z.string().default(''),

  // ⑦ AI / LLM（共通）- LLM-GW経由で使用
  aiOpenaiApiKey: z.string().default(''),
  aiAnthropicApiKey: z.string().default(''),
  aiDeepseekApiKey: z.string().default(''),
  aiKaggleToken: z.string().default(''),

  // ⑧ LLM-GW（防御用・重要）
  llmGwEnabled: envBoolean.default(false),
  llmGwProjectApiKey: z.string().default(''),
  llmGwMaxTokensPerRequest: z.coerce.number().default(2048),
  llmGwDailyTokenLimit: z.coerce.number().default(10000),
  llmGwMonthlyTokenLimit: z.coerce.number().default(300000),
  llmGwRateLimitPerMinute: z.coerce.number().default(10),
  llmGwRateLimitPerHour: z.coerce.number().default(100),

  // ⑨ アラート / 監視
  alertEnabled: envBoolean.default(false),
  alertChannel: z.enum(['slack', 'email']).default('slack'),
  alertSlackWebhookUrl: z.string().default(''),
  alertEmailTo: z.string().default(''),

  // ⑩ Render / デプロイ補助
  renderServiceName: z.string().default(''),
  renderEnvironment: z.string().default(''),

  // ⑪ 内部・運用専用（非公開）
  internalDeploySshPrivateKey: z.string().default(''),

  // ⑫ メディア（Cloudinary）
  mediaCloudinaryCloudName: z.string().default(''),
  mediaCloudinaryApiKey: z.string().default(''),
  mediaCloudinaryApiSecret: z.string().default(''),

  // ⑬ Redis（Optional - Upstash）
  redisUrl: z.string().default(''),
  redisToken: z.string().default(''),
})

export type AppConfig = z.infer<typeof appConfigSchema>
