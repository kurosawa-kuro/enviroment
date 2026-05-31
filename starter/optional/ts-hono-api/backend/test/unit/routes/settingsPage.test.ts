import { describe, it, expect, vi } from 'vitest'

// Mock render and pageController
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import { createSettingsPageRoutes } from '../../../src/presentation/routes/settings/page.js'

describe('createSettingsPageRoutes', () => {
  it('should return Hono app with routes', () => {
    const app = createSettingsPageRoutes()

    expect(app).toBeDefined()
    expect(typeof app.request).toBe('function')
  })
})
