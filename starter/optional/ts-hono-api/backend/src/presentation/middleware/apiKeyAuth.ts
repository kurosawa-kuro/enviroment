import type { Context, Next } from 'hono'
import type { AppConfig } from '../../env/index.js'

/**
 * API Key 認証ミドルウェア
 *
 * 現在は LLM_GW_PROJECT_API_KEY を使用した認証を行います。
 * キーが未設定の場合はスキップします。
 */
export function createApiKeyAuthMiddleware(config: AppConfig) {
  return async (c: Context, next: Next) => {
    // LLM_GW_PROJECT_API_KEY 未設定の場合はスキップ
    if (!config.llmGwProjectApiKey) {
      return next()
    }

    const apiKey = c.req.header('x-api-key')

    if (!apiKey || apiKey !== config.llmGwProjectApiKey) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    return next()
  }
}
