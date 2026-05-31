import { Hono } from 'hono'
import type { RouteContext } from '../types.js'
import { createDevtoolPageController } from '../../controllers/devtool/page.js'

export function createDevtoolRoutes(ctx: RouteContext) {
  const app = new Hono()
  const { container, appConfig } = ctx

  // Resolve dependencies from container
  const mongoClient = container.resolve('mongoClient')

  app.get('/', createDevtoolPageController(mongoClient, appConfig))

  return app
}
