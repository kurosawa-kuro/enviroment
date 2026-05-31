import { describe, it, expect, vi } from 'vitest'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import { createMicropostPageRoutes } from '../../../src/presentation/routes/dashboard/micropost/page.js'

describe('createMicropostPageRoutes', () => {
  it('should return Hono app with routes', () => {
    const app = createMicropostPageRoutes()

    expect(app).toBeDefined()
    expect(typeof app.request).toBe('function')
  })
})
