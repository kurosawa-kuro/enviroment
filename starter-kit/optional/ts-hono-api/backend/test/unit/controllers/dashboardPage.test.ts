import { describe, it, expect, vi } from 'vitest'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import { createDashboardPageController } from '../../../src/presentation/controllers/dashboard/page.js'
import type { AppConfig } from '../../../src/env/index.js'

describe('createDashboardPageController', () => {
  it('should return a controller function', () => {
    const config = {
      projectName: 'test',
      port: 3000,
      internalApiKey: '',
      mongodbUri: 'mongodb://localhost',
      mongoDbName: 'test'
    } as AppConfig

    const controller = createDashboardPageController(config)

    expect(typeof controller).toBe('function')
  })
})
