import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createApiController, createApiControllerWithStatus } from '../../../src/presentation/helpers/apiController.js'

describe('createApiController', () => {
  it('should wrap response in standard format', async () => {
    const app = new Hono()

    app.get('/test', createApiController(async () => {
      return { items: [1, 2, 3] }
    }))

    const res = await app.request('/test')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({
      success: true,
      data: { items: [1, 2, 3] }
    })
  })
})

describe('createApiControllerWithStatus', () => {
  it('should return custom status code', async () => {
    const app = new Hono()

    app.post('/test', createApiControllerWithStatus(async () => {
      return { id: '123' }
    }, 201))

    const res = await app.request('/test', { method: 'POST' })
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json).toEqual({
      success: true,
      data: { id: '123' }
    })
  })
})
