import type { Context } from 'hono'
import { createPageController } from '../../../helpers/pageController.js'
import type { JobUseCases } from '../../../../domain/usecases/job/index.js'

export const createSystemJobsPageController = () =>
  createPageController(
    { template: 'system/jobs/index', title: 'System Jobs', pageTitle: 'System Jobs Status', activePage: 'system-jobs' },
    () => ({ timestamp: new Date().toLocaleString('ja-JP') })
  )

// 新規予約作成API
export function createReservationController(useCases: JobUseCases) {
  return async (c: Context) => {
    const body = await c.req.json().catch(() => ({}))
    const name = body.name || `Job ${Date.now().toString(36).slice(-6)}`

    const job = await useCases.create({ name })

    // 10秒かけてステータスを完了に推移させる（2秒ごとに更新）
    simulateProcessing(useCases, job.id)

    return c.json({
      success: true,
      data: job
    })
  }
}

// ステータス取得API
export function getReservationStatusController(useCases: JobUseCases) {
  return async (c: Context) => {
    const id = c.req.param('id')
    const job = await useCases.get(id)

    if (!job) {
      return c.json({
        success: false,
        error: 'Job not found'
      }, 404)
    }

    return c.json({
      success: true,
      data: job
    })
  }
}

// 全予約一覧API
export function getAllReservationsController(useCases: JobUseCases) {
  return async (c: Context) => {
    const jobs = await useCases.list(20)

    return c.json({
      success: true,
      data: jobs
    })
  }
}

// 予約削除API
export function deleteReservationController(useCases: JobUseCases) {
  return async (c: Context) => {
    const id = c.req.param('id')
    const deleted = await useCases.delete(id)

    if (deleted) {
      return c.json({ success: true })
    }

    return c.json({
      success: false,
      error: 'Job not found'
    }, 404)
  }
}

// 処理シミュレーション（10秒で完了）
function simulateProcessing(useCases: JobUseCases, id: string) {
  const steps = [
    { delay: 0, status: 'pending' as const, progress: 0 },
    { delay: 2000, status: 'processing' as const, progress: 20 },
    { delay: 4000, status: 'processing' as const, progress: 40 },
    { delay: 6000, status: 'processing' as const, progress: 60 },
    { delay: 8000, status: 'processing' as const, progress: 80 },
    { delay: 10000, status: 'completed' as const, progress: 100 }
  ]

  steps.forEach(step => {
    setTimeout(async () => {
      const job = await useCases.get(id)
      if (job && job.status !== 'failed') {
        await useCases.update({
          id,
          updates: {
            status: step.status,
            progress: step.progress
          }
        })
      }
    }, step.delay)
  })
}
