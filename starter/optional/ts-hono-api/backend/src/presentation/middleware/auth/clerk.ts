import type { Context, Next, MiddlewareHandler } from 'hono'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import type { AppConfig } from '../../../env/index.js'
import type { AuthContext, PolicyFunction } from '../../../domain/auth/index.js'
import { buildAuthContext } from '../../../domain/auth/index.js'
import { authAudit } from '../../../shared/authAuditLogger.js'

/**
 * AUTH FEATURE: Clerk認証ミドルウェア
 *
 * AUTH_ENABLED=false の場合はパススルー（認証スキップ）
 * AUTH_ENABLED=true の場合はClerk認証を適用
 *
 * 削除手順:
 * 1. このファイルを削除
 * 2. npm uninstall @hono/clerk-auth @clerk/backend
 */

/**
 * 認証ミドルウェアを作成
 * AUTH_ENABLED=false の場合は何もしないミドルウェアを返す
 */
export function createAuthMiddleware(config: AppConfig): MiddlewareHandler {
  if (!config.authEnabled) {
    // 認証無効時はパススルー
    return async (_c: Context, next: Next) => {
      await next()
    }
  }

  // Clerk認証ミドルウェア（明示的にキーを渡す）
  return clerkMiddleware({
    secretKey: config.authClerkSecretKey,
    publishableKey: config.authClerkPublishableKey,
  })
}

/**
 * 認証必須ミドルウェア
 * 認証されていない場合:
 * - APIリクエスト（/api/*）: 401を返す
 * - ページリクエスト: /auth/login にリダイレクト
 */
export function createRequireAuthMiddleware(config: AppConfig): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    // 認証無効時はスキップ
    if (!config.authEnabled) {
      await next()
      return
    }

    const auth = getAuth(c)
    if (!auth?.userId) {
      const path = c.req.path
      const isApiRequest = path.startsWith('/api/') ||
                          c.req.header('Accept')?.includes('application/json') ||
                          c.req.header('Content-Type')?.includes('application/json')

      if (isApiRequest) {
        return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401)
      }

      // ページリクエスト: ログインページへリダイレクト
      const redirectUrl = encodeURIComponent(path)
      return c.redirect(`/auth/login?redirect=${redirectUrl}`)
    }

    await next()
  }
}

/**
 * 現在の認証情報を取得
 * 認証無効時はnullを返す
 */
export function getCurrentAuth(c: Context, config: AppConfig) {
  if (!config.authEnabled) {
    return null
  }
  return getAuth(c)
}

/**
 * 認証ユーザーIDを取得
 * 認証無効時はnullを返す
 */
export function getCurrentUserId(c: Context, config: AppConfig): string | null {
  const auth = getCurrentAuth(c, config)
  return auth?.userId ?? null
}

// ============================================================================
// New Authorization System (Role-based)
// ============================================================================

/**
 * Get AuthContext for the current request
 * Returns null if authentication is disabled or user is not authenticated
 */
export function getAuthContext(c: Context, config: AppConfig): AuthContext | null {
  if (!config.authEnabled) {
    return null
  }

  const auth = getAuth(c)
  if (!auth?.userId) {
    return null
  }

  // Build full auth context with role resolution
  // Note: Owner admin user IDs should be configured via Clerk's publicMetadata
  return buildAuthContext(
    auth.userId,
    auth.sessionId ?? null,
    auth.sessionClaims as { publicMetadata?: { role?: string } } | null,
    [], // Owner admin user IDs - configure via Clerk publicMetadata instead
    auth.orgId,
    auth.orgRole
  )
}

/**
 * Middleware that builds and stores AuthContext in request context
 * Should be applied after clerkMiddleware
 */
export function createAuthContextMiddleware(config: AppConfig): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const authContext = getAuthContext(c, config)
    if (authContext) {
      c.set('authContext', authContext)
    }
    await next()
  }
}

/**
 * Authorization middleware that checks a policy function
 * Must be used after authentication middleware and createAuthContextMiddleware
 *
 * @param config - Application config
 * @param policy - Policy function to check
 * @param options - Optional settings
 */
export function createAuthorizeMiddleware(
  config: AppConfig,
  policy: PolicyFunction,
  options?: { skipInTest?: boolean; enableAuditLog?: boolean }
): MiddlewareHandler {
  const skipInTest = options?.skipInTest ?? true
  const enableAuditLog = options?.enableAuditLog ?? false

  return async (c: Context, next: Next) => {
    // Skip in test environment (preserve current behavior)
    if (skipInTest && process.env.APP_ENV === 'local') {
      await next()
      return
    }

    // Skip if auth disabled
    if (!config.authEnabled) {
      await next()
      return
    }

    const authContext = c.get('authContext') as AuthContext | undefined
    const path = c.req.path
    const method = c.req.method
    const requestId = c.get('requestId') as string | undefined

    // No auth context = not authenticated
    if (!authContext) {
      if (enableAuditLog) {
        authAudit.unauthorized(path, method, requestId)
      }

      const isApiRequest =
        path.startsWith('/api/') ||
        c.req.header('Accept')?.includes('application/json') ||
        c.req.header('Content-Type')?.includes('application/json')

      if (isApiRequest) {
        return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401)
      }

      const redirectUrl = encodeURIComponent(path)
      return c.redirect(`/auth/login?redirect=${redirectUrl}`)
    }

    // Check policy
    const allowed = await policy(authContext)
    if (!allowed) {
      if (enableAuditLog) {
        authAudit.accessDenied(
          authContext.userId,
          path,
          method,
          `Policy denied for role: ${authContext.role}`,
          authContext.role,
          requestId
        )
      }

      const isApiRequest =
        path.startsWith('/api/') ||
        c.req.header('Accept')?.includes('application/json')

      if (isApiRequest) {
        return c.json({ error: 'Forbidden', message: 'Access denied' }, 403)
      }

      return c.text('Forbidden', 403)
    }

    await next()
  }
}
