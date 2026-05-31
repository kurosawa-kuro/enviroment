import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createApiKeyAuthMiddleware } from '../../../src/presentation/middleware/apiKeyAuth.js'
import type { AppConfig } from '../../../src/env/index.js'

describe('createApiKeyAuthMiddleware', () => {
  it('should pass when API key matches', async () => {
    const config = { llmGwProjectApiKey: 'secret-key' } as AppConfig
    const app = new Hono()

    app.use('*', createApiKeyAuthMiddleware(config))
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test', {
      headers: { 'x-api-key': 'secret-key' }
    })

    expect(res.status).toBe(200)
  })

  it('should return 401 when API key is missing', async () => {
    const config = { llmGwProjectApiKey: 'secret-key' } as AppConfig
    const app = new Hono()

    app.use('*', createApiKeyAuthMiddleware(config))
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test')

    expect(res.status).toBe(401)
  })

  it('should skip when llmGwProjectApiKey is not configured', async () => {
    const config = { llmGwProjectApiKey: '' } as AppConfig
    const app = new Hono()

    app.use('*', createApiKeyAuthMiddleware(config))
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test')

    expect(res.status).toBe(200)
  })
})
