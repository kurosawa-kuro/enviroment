import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createAuthMiddleware, createRequireAuthMiddleware } from '../../../src/presentation/middleware/auth/clerk.js'
import type { AppConfig } from '../../../src/env/index.js'

// Mock clerk
vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => next()),
  getAuth: vi.fn(() => null)
}))

describe('createAuthMiddleware', () => {
  it('should pass through when auth is disabled', async () => {
    const config = { authEnabled: false } as AppConfig
    const app = new Hono()

    app.use('*', createAuthMiddleware(config))
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test')

    expect(res.status).toBe(200)
  })
})

describe('createRequireAuthMiddleware', () => {
  it('should pass through when auth is disabled', async () => {
    const config = { authEnabled: false } as AppConfig
    const app = new Hono()

    app.use('*', createRequireAuthMiddleware(config))
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test')

    expect(res.status).toBe(200)
  })

  it('should return 401 for API requests without auth', async () => {
    const config = { authEnabled: true } as AppConfig
    const app = new Hono()

    app.use('*', createRequireAuthMiddleware(config))
    app.get('/api/test', (c) => c.json({ success: true }))

    const res = await app.request('/api/test')

    expect(res.status).toBe(401)
  })
})
