import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import type { MicropostUseCases } from '../../../../domain/usecases/micropost/index.js'
import type { AppConfig } from '../../../../env/index.js'
import {
  createMicropostListController,
  createMicropostGetController,
  createMicropostCreateController,
  createMicropostUpdateController,
  createMicropostDeleteController,
} from '../../../controllers/dashboard/micropost.js'
import { protectedCorsMiddleware } from '../../../middleware/cors.js'

interface MicropostApiDeps {
  micropostUseCases: MicropostUseCases
  apiKeyAuth: MiddlewareHandler
  appConfig: AppConfig
}

/**
 * Micropost API Routes
 *
 * GET    /microposts/api      - 一覧取得
 * GET    /microposts/api/:id  - 詳細取得
 * POST   /microposts/api      - 新規作成
 * PUT    /microposts/api/:id  - 更新
 * DELETE /microposts/api/:id  - 削除
 */
export function createMicropostApiRoutes(deps: MicropostApiDeps) {
  const app = new Hono()
  const { micropostUseCases, apiKeyAuth, appConfig } = deps

  app.use('/*', protectedCorsMiddleware)
  app.get('/', apiKeyAuth, createMicropostListController(micropostUseCases))
  app.get('/:id', apiKeyAuth, createMicropostGetController(micropostUseCases))
  app.post('/', apiKeyAuth, createMicropostCreateController(micropostUseCases, appConfig))
  app.put('/:id', apiKeyAuth, createMicropostUpdateController(micropostUseCases))
  app.delete('/:id', apiKeyAuth, createMicropostDeleteController(micropostUseCases))

  return app
}
