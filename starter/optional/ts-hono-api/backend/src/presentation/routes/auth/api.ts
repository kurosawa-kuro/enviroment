import { Hono } from 'hono'
import type { AppConfig } from '../../../env/index.js'
import { getCurrentAuth, getCurrentUserId } from '../../middleware/auth/index.js'

interface AuthApiDeps {
  appConfig: AppConfig
}

/**
 * Auth API Routes
 *
 * GET /auth/status - 認証機能のステータス
 * GET /auth/me     - 現在のユーザー情報
 */
export function createAuthApiRoutes(deps: AuthApiDeps) {
  const app = new Hono()
  const { appConfig } = deps

  /**
   * GET /auth/status
   * 認証機能のステータスを返す
   */
  app.get('/status', (c) => {
    return c.json({
      enabled: appConfig.authEnabled,
      provider: appConfig.authEnabled ? 'clerk' : null,
    })
  })

  /**
   * GET /auth/me
   * 現在のユーザー情報を返す
   * 認証無効時は null を返す
   */
  app.get('/me', (c) => {
    if (!appConfig.authEnabled) {
      return c.json({
        authenticated: false,
        user: null,
        message: 'Authentication is disabled',
      })
    }

    const auth = getCurrentAuth(c, appConfig)
    const userId = getCurrentUserId(c, appConfig)

    if (!userId) {
      return c.json({
        authenticated: false,
        user: null,
      })
    }

    return c.json({
      authenticated: true,
      user: {
        id: userId,
        sessionId: auth?.sessionId ?? null,
        orgId: auth?.orgId ?? null,
        orgRole: auth?.orgRole ?? null,
      },
    })
  })

  return app
}
