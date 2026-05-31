import { describe, it, expect, vi } from 'vitest'
import { createAuthApiRoutes } from '../../../src/presentation/routes/auth/api.js'
import type { AppConfig } from '../../../src/env/index.js'

// Mock auth
vi.mock('../../../src/presentation/middleware/auth/index.js', () => ({
  getCurrentAuth: vi.fn(() => null),
  getCurrentUserId: vi.fn(() => null)
}))

describe('createAuthApiRoutes', () => {
  it('should return auth status', async () => {
    const config = { authEnabled: false } as AppConfig
    const app = createAuthApiRoutes({ appConfig: config })

    const res = await app.request('/status')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.enabled).toBe(false)
  })

  it('should return user info when auth disabled', async () => {
    const config = { authEnabled: false } as AppConfig
    const app = createAuthApiRoutes({ appConfig: config })

    const res = await app.request('/me')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.authenticated).toBe(false)
  })
})
