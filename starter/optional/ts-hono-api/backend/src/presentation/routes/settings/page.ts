import { Hono } from 'hono'
import { createSettingsPageController } from '../../controllers/settings/page.js'

/**
 * Settings Page Routes
 *
 * GET /settings - 設定ページ
 */
export function createSettingsPageRoutes() {
  const app = new Hono()

  app.get('/', createSettingsPageController())

  return app
}
