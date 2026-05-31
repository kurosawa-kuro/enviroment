import { Hono } from 'hono'
import type { SettingsUseCases } from '../../../domain/usecases/settings/index.js'
import {
  createSettingsGetController,
  createSettingsSaveController,
  createSettingsHistoryController
} from '../../controllers/settings/api.js'

interface SettingsApiDeps {
  settingsUseCases: SettingsUseCases
}

/**
 * Settings API Routes
 *
 * GET  /settings/api         - 設定取得
 * POST /settings/api         - 設定保存
 * GET  /settings/api/history - 設定履歴取得
 */
export function createSettingsApiRoutes(deps: SettingsApiDeps) {
  const app = new Hono()
  const { settingsUseCases } = deps

  app.get('/', createSettingsGetController(settingsUseCases))
  app.post('/', createSettingsSaveController(settingsUseCases))
  app.get('/history', createSettingsHistoryController(settingsUseCases))

  return app
}
