import { describe, it, expect, vi } from 'vitest'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import { createSettingsPageController } from '../../../src/presentation/controllers/settings/page.js'

describe('createSettingsPageController', () => {
  it('should return a controller function', () => {
    const controller = createSettingsPageController()

    expect(typeof controller).toBe('function')
  })
})
