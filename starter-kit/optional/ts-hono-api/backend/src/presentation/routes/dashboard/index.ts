import { Hono } from 'hono'
import type { RouteContext } from '../types.js'
import { createDashboardPageController } from '../../controllers/dashboard/page.js'
import { createMicropostRoutes } from './micropost/index.js'

export function createDashboardRoutes(ctx: RouteContext) {
  const app = new Hono()
  const { appConfig } = ctx

  // Dashboard Page
  app.get('/', createDashboardPageController(appConfig))

  // Micropost Routes
  app.route('/microposts', createMicropostRoutes(ctx))

  return app
}
