import { Hono } from 'hono'
import type { RouteContext } from '../types.js'
import { createSettingsPageRoutes } from './page.js'
import { createSettingsApiRoutes } from './api.js'

/**
 * Settings Routes
 *
 * ページルートとAPIルートを統合
 */
export function createSettingsRoutes(ctx: RouteContext) {
  const app = new Hono()
  const { container } = ctx

  // Resolve use cases from container
  const settingsUseCases = container.resolve('settingsUseCases')

  // API Routes
  app.route('/api', createSettingsApiRoutes({ settingsUseCases }))

  // Page Routes
  app.route('/', createSettingsPageRoutes())

  return app
}
