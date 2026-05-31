import type { Context } from 'hono'
import type { MicropostStatus } from '../../../domain/entities/micropost.js'
import type { ListMicropostFilters } from '../../../domain/repositories/micropost.js'
import type { MicropostUseCases } from '../../../domain/usecases/micropost/index.js'
import type { AppConfig } from '../../../env/index.js'
import { createMicropostSchema, updateMicropostSchema } from '../../schemas/micropost.js'
import { validateBody } from '../../../shared/validators.js'
import { createPageController } from '../../helpers/pageController.js'
import { Errors } from '../../../shared/errors.js'
import { logger } from '../../../shared/logger.js'
import { getCurrentUserId } from '../../middleware/auth/index.js'

// 認証無効時のフォールバック用ダミーユーザーID
const DEFAULT_CREATOR_ID = 'user_dummy_creator'

// Page Controllers
export const createMicropostListPageController = () =>
  createPageController({
    template: 'dashboard/micropost/index',
    title: 'Microposts',
    activePage: 'microposts',
  })

export const createMicropostGetPageController = () =>
  createPageController(
    { template: 'dashboard/micropost/show', title: 'Micropost Detail', activePage: 'microposts' },
    (c) => ({ micropostId: c.req.param('id') })
  )

export const createMicropostNewPageController = () =>
  createPageController({
    template: 'dashboard/micropost/new',
    title: 'Create Micropost',
    activePage: 'microposts',
  })

export const createMicropostEditPageController = () =>
  createPageController(
    { template: 'dashboard/micropost/edit', title: 'Edit Micropost', activePage: 'microposts' },
    (c) => ({ micropostId: c.req.param('id') })
  )

// API Controllers

export function createMicropostListController(useCases: MicropostUseCases) {
  return async (c: Context) => {
    const filters: ListMicropostFilters = {}

    const status = c.req.query('status')
    if (status === 'draft' || status === 'published') {
      filters.status = status as MicropostStatus
    }

    const creatorId = c.req.query('creatorId')
    if (creatorId) {
      filters.creatorId = creatorId
    }

    const microposts = await useCases.list(filters)
    return c.json({ success: true, data: { microposts } })
  }
}

export function createMicropostCreateController(useCases: MicropostUseCases, appConfig: AppConfig) {
  return async (c: Context) => {
    const body = await c.req.parseBody({ all: true })

    const validation = validateBody(createMicropostSchema, {
      title: body['title'],
      body: body['body'],
      status: body['status'],
    })

    if (!validation.success) {
      throw Errors.badRequest(validation.error)
    }

    const { title, body: postBody, status } = validation.data
    const imageFile = body['image'] instanceof File ? body['image'] : undefined

    // AUTH_ENABLED=true の場合はClerkから取得、無効時はデフォルト値
    const creatorId = getCurrentUserId(c, appConfig) ?? DEFAULT_CREATOR_ID

    try {
      const micropost = await useCases.create({
        input: {
          title,
          body: postBody,
          creatorId,
          status: status as MicropostStatus,
        },
        imageFile,
      })
      return c.json({ success: true, data: { micropost } }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create micropost'
      logger.error({ err }, 'Micropost creation failed')
      throw Errors.badRequest(message)
    }
  }
}

export function createMicropostGetController(useCases: MicropostUseCases) {
  return async (c: Context) => {
    const id = c.req.param('id')
    const micropost = await useCases.get(id)
    if (!micropost) throw Errors.notFound('Micropost')
    return c.json({ success: true, data: { micropost } })
  }
}

export function createMicropostUpdateController(useCases: MicropostUseCases) {
  return async (c: Context) => {
    const id = c.req.param('id')
    const body = await c.req.parseBody({ all: true })

    const validation = validateBody(updateMicropostSchema, {
      title: body['title'],
      body: body['body'],
      status: body['status'],
    })

    if (!validation.success) {
      throw Errors.badRequest(validation.error)
    }

    const { title, body: postBody, status } = validation.data
    const imageFile = body['image'] instanceof File ? body['image'] : undefined

    try {
      const micropost = await useCases.update({
        id,
        input: {
          title,
          body: postBody,
          status: status as MicropostStatus,
        },
        imageFile,
      })

      if (!micropost) {
        throw Errors.notFound('Micropost')
      }

      return c.json({ success: true, data: { micropost } })
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        throw Errors.notFound('Micropost')
      }
      const message = err instanceof Error ? err.message : 'Failed to update micropost'
      logger.error({ err }, 'Micropost update failed')
      throw Errors.badRequest(message)
    }
  }
}

export function createMicropostDeleteController(useCases: MicropostUseCases) {
  return async (c: Context) => {
    const id = c.req.param('id')

    const deleted = await useCases.delete(id)
    if (!deleted) {
      throw Errors.notFound('Micropost')
    }

    return c.json({ success: true, message: 'Micropost deleted' })
  }
}
