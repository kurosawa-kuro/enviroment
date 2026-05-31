import { Hono } from 'hono'
import type { RouteContext } from '../../types.js'
import { createMicropostPageRoutes } from './page.js'
import { createMicropostApiRoutes } from './api.js'

/**
 * Micropost Routes
 *
 * ページルートとAPIルートを統合
 */
export function createMicropostRoutes(ctx: RouteContext) {
  const app = new Hono()
  const { container, apiKeyAuth, appConfig } = ctx

  // Resolve use cases from container
  const micropostUseCases = container.resolve('micropostUseCases')

  // API Routes (must be defined before page routes to prevent 'api' being captured as :id)
  app.route('/api', createMicropostApiRoutes({
    micropostUseCases,
    apiKeyAuth,
    appConfig,
  }))

  // Page Routes
  app.route('/', createMicropostPageRoutes())

  return app
}
