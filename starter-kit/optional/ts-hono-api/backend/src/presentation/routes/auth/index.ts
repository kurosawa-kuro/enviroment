import { Hono } from 'hono'
import type { RouteContext } from '../types.js'
import { createAuthPageRoutes } from './page.js'
import { createAuthApiRoutes } from './api.js'

/**
 * AUTH FEATURE: 認証関連ルート
 *
 * 削除手順:
 * 1. このディレクトリ (routes/auth/) を削除
 * 2. routes/index.ts から createAuthRoutes の参照を削除
 */
export function createAuthRoutes(ctx: RouteContext) {
  const app = new Hono()
  const { appConfig } = ctx

  // Page Routes (login page)
  app.route('/', createAuthPageRoutes({ appConfig }))

  // API Routes (status, me)
  app.route('/', createAuthApiRoutes({ appConfig }))

  return app
}
