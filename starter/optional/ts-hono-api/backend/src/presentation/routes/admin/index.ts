import { Hono } from 'hono'
import type { RouteContext } from '../types.js'
import { createAdminPageController } from '../../controllers/admin/page.js'

export function createAdminRoutes(_ctx: RouteContext) {
  const app = new Hono()

  app.get('/', createAdminPageController())

  return app
}
