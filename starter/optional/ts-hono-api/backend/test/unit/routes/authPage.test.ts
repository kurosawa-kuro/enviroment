import { describe, it, expect, vi } from 'vitest'
import { createAuthPageRoutes } from '../../../src/presentation/routes/auth/page.js'
import type { AppConfig } from '../../../src/env/index.js'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

describe('createAuthPageRoutes', () => {
  it('should redirect to dashboard when auth disabled', async () => {
    const config = { authEnabled: false } as AppConfig
    const app = createAuthPageRoutes({ appConfig: config })

    const res = await app.request('/login')

    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/dashboard')
  })
})
