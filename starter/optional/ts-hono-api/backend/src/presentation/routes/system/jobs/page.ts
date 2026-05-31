import { Hono } from 'hono'
import { createSystemJobsPageController } from '../../../controllers/system/jobs/page.js'

/**
 * System Jobs Page Routes
 *
 * GET /system/jobs - ジョブ管理ページ
 */
export function createSystemJobsPageRoutes() {
  const app = new Hono()

  app.get('/', createSystemJobsPageController())

  return app
}
