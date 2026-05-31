import { Hono } from 'hono'
import type { JobUseCases } from '../../../../domain/usecases/job/index.js'
import {
  createReservationController,
  getAllReservationsController,
  getReservationStatusController,
  deleteReservationController
} from '../../../controllers/system/jobs/page.js'

interface SystemJobsApiDeps {
  jobUseCases: JobUseCases
}

/**
 * System Jobs API Routes
 *
 * POST   /system/jobs/api      - ジョブ作成
 * GET    /system/jobs/api      - ジョブ一覧
 * GET    /system/jobs/api/:id  - ジョブ状態取得
 * DELETE /system/jobs/api/:id  - ジョブ削除
 */
export function createSystemJobsApiRoutes(deps: SystemJobsApiDeps) {
  const app = new Hono()
  const { jobUseCases } = deps

  app.post('/', createReservationController(jobUseCases))
  app.get('/', getAllReservationsController(jobUseCases))
  app.get('/:id', getReservationStatusController(jobUseCases))
  app.delete('/:id', deleteReservationController(jobUseCases))

  return app
}
