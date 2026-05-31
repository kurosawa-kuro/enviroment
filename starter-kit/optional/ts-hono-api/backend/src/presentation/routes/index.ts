import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { AwilixContainer } from 'awilix'
import type { Cradle } from '../../di/container.js'
import type { AppConfig } from '../../env/index.js'
import type { RouteContext } from './types.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { requestLogger } from '../middleware/requestLogger.js'
import { rateLimiterMiddleware } from '../middleware/rateLimiter.js'
import { createApiKeyAuthMiddleware } from '../middleware/apiKeyAuth.js'
// AUTH FEATURE: 認証ミドルウェア
import { createAuthStrategy, authRequired, authOptional } from '../middleware/auth/index.js'
import { canAccess } from '../../domain/auth/index.js'

// API routes
import { createHealthRoutes } from './api/health.js'

// AUTH FEATURE: 認証ルート
import { createAuthRoutes } from './auth/index.js'

// Page routes (5 pages: Dashboard, Settings, Admin, Devtool, System/Jobs)
import { createDashboardRoutes } from './dashboard/index.js'
import { createSettingsRoutes } from './settings/index.js'
import { createAdminRoutes } from './admin/index.js'
import { createDevtoolRoutes } from './devtool/index.js'
import { createSystemJobsRoutes } from './system/jobs/index.js'

export function createRoutes(container: AwilixContainer<Cradle>, appConfig: AppConfig) {
  const app = new Hono()

  // Global middleware
  app.use('*', rateLimiterMiddleware)
  app.use('*', requestLogger)
  app.onError(errorHandler)

  // API key auth middleware (for protected routes)
  const apiKeyAuth = createApiKeyAuthMiddleware(appConfig)

  // AUTH FEATURE: Auth strategy for declarative authentication/authorization
  const auth = createAuthStrategy(appConfig)

  // Route context（依存はcontainerから解決）
  const ctx: RouteContext = {
    container,
    appConfig,
    apiKeyAuth,
    auth,
  }

  // Static file serving for uploaded images
  const prodStaticRoot = path.join(process.cwd(), 'dist', 'presentation', 'public')
  const staticRoot = fs.existsSync(prodStaticRoot)
    ? './dist/presentation/public'
    : './src/presentation/public'
  app.use('/uploads/*', serveStatic({ root: staticRoot }))
  app.get('/favicon.svg', serveStatic({ root: staticRoot, path: '/favicon.svg' }))

  // Root redirect to dashboard
  app.get('/', (c) => c.redirect('/dashboard'))

  // API routes (common endpoints)
  app.route('/api', createHealthRoutes(ctx))

  // AUTH FEATURE: 認証ルート（公開だがClerkミドルウェアは必要）
  app.use('/auth/*', ...authOptional(auth))
  app.route('/auth', createAuthRoutes(ctx))

  // ============================================================================
  // AUTH FEATURE: 保護ルートに認証ミドルウェアを適用（宣言的パターン）
  // ============================================================================
  // AUTH_ENABLED=false の場合はすべてパススルー
  // ポリシーにより「誰が・何を・どこまで」できるかをコードで明示
  // Note: 末尾スラッシュありなし両方にマッチさせるため、両パターン指定

  // Dashboard - owner role only
  app.use('/dashboard', ...authRequired(auth, canAccess.dashboard))
  app.use('/dashboard/*', ...authRequired(auth, canAccess.dashboard))

  // Settings - viewer role で読み取り可（書き込みはAPI側で operator 以上を要求）
  app.use('/settings', ...authRequired(auth, canAccess.settingsRead))
  app.use('/settings/*', ...authRequired(auth, canAccess.settingsRead))

  // Admin - admin role 以上
  app.use('/admin', ...authRequired(auth, canAccess.adminPage))
  app.use('/admin/*', ...authRequired(auth, canAccess.adminPage))

  // Devtool - admin role 以上
  app.use('/devtool', ...authRequired(auth, canAccess.devtool))
  app.use('/devtool/*', ...authRequired(auth, canAccess.devtool))

  // System/Jobs - owner only
  app.use('/system/jobs', ...authRequired(auth, canAccess.system))
  app.use('/system/jobs/*', ...authRequired(auth, canAccess.system))

  // Pages (each route includes its own API endpoints)
  app.route('/dashboard', createDashboardRoutes(ctx))
  app.route('/settings', createSettingsRoutes(ctx))
  app.route('/admin', createAdminRoutes(ctx))
  app.route('/devtool', createDevtoolRoutes(ctx))
  app.route('/system/jobs', createSystemJobsRoutes(ctx))

  return app
}
