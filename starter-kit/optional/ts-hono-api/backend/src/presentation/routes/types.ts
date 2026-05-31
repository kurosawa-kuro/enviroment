/**
 * Route Context
 * --------------------------------
 * 各Routeに渡すコンテキスト
 *
 * 設計方針:
 * - container: Repository/Serviceはcontainerから解決
 * - appConfig: 環境設定（containerに入れず直接渡す）
 * - Middlewares: リクエストスコープのため直接渡す
 */
import type { MiddlewareHandler } from 'hono'
import type { AwilixContainer } from 'awilix'
import type { AppConfig } from '../../env/index.js'
import type { Cradle } from '../../di/container.js'
import type { AuthStrategy } from '../middleware/auth/index.js'

export interface RouteContext {
  // DI Container（依存解決はここから）
  container: AwilixContainer<Cradle>

  // Config
  appConfig: AppConfig

  // Middlewares（リクエストスコープ、containerに入れない）
  apiKeyAuth: MiddlewareHandler

  // AUTH FEATURE: Auth strategy for declarative auth
  auth: AuthStrategy
}
