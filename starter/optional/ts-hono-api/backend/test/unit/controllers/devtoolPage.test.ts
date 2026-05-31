import { describe, it, expect, vi } from 'vitest'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import { createDevtoolPageController } from '../../../src/presentation/controllers/devtool/page.js'
import type { AppConfig } from '../../../src/env/index.js'

describe('createDevtoolPageController', () => {
  it('should return a controller function', () => {
    const config = {
      port: 3000,
      projectName: 'test',
      mongodbUri: 'mongodb://localhost',
      mongoDbName: 'test',
      authEnabled: false,
      authJwtSecret: '',
      internalApiKey: ''
    } as AppConfig

    const controller = createDevtoolPageController(null, config)

    expect(typeof controller).toBe('function')
  })
})
