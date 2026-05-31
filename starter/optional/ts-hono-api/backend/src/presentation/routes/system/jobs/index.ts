import { Hono } from 'hono'
import type { RouteContext } from '../../types.js'
import { createSystemJobsPageRoutes } from './page.js'
import { createSystemJobsApiRoutes } from './api.js'

/**
 * System Jobs Routes
 *
 * ページルートとAPIルートを統合
 */
export function createSystemJobsRoutes(ctx: RouteContext) {
  const app = new Hono()

  // Resolve use cases from container
  const jobUseCases = ctx.container.resolve('jobUseCases')

  // API Routes
  app.route('/api', createSystemJobsApiRoutes({ jobUseCases }))

  // Page Routes
  app.route('/', createSystemJobsPageRoutes())

  return app
}
