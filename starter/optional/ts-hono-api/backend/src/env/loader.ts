import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { appConfigSchema, type AppConfig } from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..')

/**
 * ConfigMap ファイルパス
 * - ローカル: {project}/env/config.yaml
 * - K8s: CONFIG_FILE_PATH で指定
 */
const CONFIG_FILE_PATH = process.env.CONFIG_FILE_PATH || join(PROJECT_ROOT, 'env', 'config.yaml')

function loadConfigFile(): Record<string, unknown> {
  if (!existsSync(CONFIG_FILE_PATH)) {
    return {}
  }
  try {
    return yaml.load(readFileSync(CONFIG_FILE_PATH, 'utf-8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function loadFromEnv(): Record<string, unknown> {
  return {
    // ① 実行モード / 環境制御（最上位）
    appEnv: process.env.APP_ENV,
    appMode: process.env.APP_MODE,

    // ② サーバー / アプリ基本設定
    projectName: process.env.PROJECT_NAME,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    rateLimitPerMinute: process.env.RATE_LIMIT_PER_MINUTE,

    // ③ 認証・認可（Clerk / 内部API）
    authEnabled: process.env.AUTH_ENABLED,
    authJwtSecret: process.env.AUTH_JWT_SECRET,
    authClerkPublishableKey: process.env.AUTH_CLERK_PUBLISHABLE_KEY,
    authClerkSecretKey: process.env.AUTH_CLERK_SECRET_KEY,

    // ③-2 内部通知API
    notifyInternalApiUrl: process.env.NOTIFY_INTERNAL_API_URL,
    notifyInternalApiKey: process.env.NOTIFY_INTERNAL_API_KEY,

    // ④ データベース
    dbMongodbUri: process.env.DB_MONGODB_URI,
    dbNeonUri: process.env.DB_NEON_URI,
    mongoDbName: process.env.DB_MONGODB_DB_NAME,

    // ⑤ AWS（Read / 管理系）
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,

    // ⑥ GitHub / CI・自動化
    gitGithubAccessToken: process.env.GIT_GITHUB_ACCESS_TOKEN,

    // ⑦ AI / LLM（共通）- LLM-GW経由で使用
    aiOpenaiApiKey: process.env.AI_OPENAI_API_KEY,
    aiAnthropicApiKey: process.env.AI_ANTHROPIC_API_KEY,
    aiDeepseekApiKey: process.env.AI_DEEPSEEK_API_KEY,
    aiKaggleToken: process.env.AI_KAGGLE_TOKEN,

    // ⑧ LLM-GW（防御用・重要）
    llmGwEnabled: process.env.LLM_GW_ENABLED,
    llmGwProjectApiKey: process.env.LLM_GW_PROJECT_API_KEY,
    llmGwMaxTokensPerRequest: process.env.LLM_GW_MAX_TOKENS_PER_REQUEST,
    llmGwDailyTokenLimit: process.env.LLM_GW_DAILY_TOKEN_LIMIT,
    llmGwMonthlyTokenLimit: process.env.LLM_GW_MONTHLY_TOKEN_LIMIT,
    llmGwRateLimitPerMinute: process.env.LLM_GW_RATE_LIMIT_PER_MINUTE,
    llmGwRateLimitPerHour: process.env.LLM_GW_RATE_LIMIT_PER_HOUR,

    // ⑨ アラート / 監視
    alertEnabled: process.env.ALERT_ENABLED,
    alertChannel: process.env.ALERT_CHANNEL,
    alertSlackWebhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL,
    alertEmailTo: process.env.ALERT_EMAIL_TO,

    // ⑩ Render / デプロイ補助
    renderServiceName: process.env.RENDER_SERVICE_NAME,
    renderEnvironment: process.env.RENDER_ENVIRONMENT,

    // ⑪ 内部・運用専用（非公開）
    internalDeploySshPrivateKey: process.env.INTERNAL_DEPLOY_SSH_PRIVATE_KEY,

    // ⑫ メディア（Cloudinary）
    mediaCloudinaryCloudName: process.env.MEDIA_CLOUDINARY_CLOUD_NAME,
    mediaCloudinaryApiKey: process.env.MEDIA_CLOUDINARY_API_KEY,
    mediaCloudinaryApiSecret: process.env.MEDIA_CLOUDINARY_API_SECRET,

    // ⑬ Redis（Optional - Upstash）
    redisUrl: process.env.REDIS_URL,
    redisToken: process.env.REDIS_TOKEN,
  }
}

function merge(...configs: Record<string, unknown>[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined && value !== '') {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * 設定読み込み
 * 優先順位: ConfigMapファイル > 環境変数 > スキーマデフォルト
 */
export function loadConfig(): AppConfig {
  const fromEnv = loadFromEnv()
  const fromFile = loadConfigFile()
  const merged = merge(fromEnv, fromFile)

  // デバッグ: 設定ソースを表示
  console.log('[Config] From env:', { port: fromEnv.port, appEnv: fromEnv.appEnv, logLevel: fromEnv.logLevel })
  console.log('[Config] From file:', { port: fromFile.port, appEnv: fromFile.appEnv, logLevel: fromFile.logLevel })
  console.log('[Config] Merged:', { port: merged.port, appEnv: merged.appEnv, logLevel: merged.logLevel })

  const result = appConfigSchema.safeParse(merged)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new Error(`Config validation failed: ${errors}`)
  }

  console.log('[Config] Final (after schema):', { port: result.data.port, appEnv: result.data.appEnv, logLevel: result.data.logLevel })

  return result.data
}
