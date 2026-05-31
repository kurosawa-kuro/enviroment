import { describe, it, expect, vi } from 'vitest'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import { createAdminPageController } from '../../../src/presentation/controllers/admin/page.js'

describe('createAdminPageController', () => {
  it('should return a controller function', () => {
    const controller = createAdminPageController()

    expect(typeof controller).toBe('function')
  })
})
