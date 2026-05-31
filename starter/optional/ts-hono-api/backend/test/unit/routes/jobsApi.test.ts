import { describe, it, expect } from 'vitest'
import { createSystemJobsApiRoutes } from '../../../src/presentation/routes/system/jobs/api.js'
import { createMockJobUseCases } from '../../helpers/mocks.js'

describe('createSystemJobsApiRoutes', () => {
  it('should return Hono app with routes', () => {
    const mockUseCases = createMockJobUseCases()

    const app = createSystemJobsApiRoutes({ jobUseCases: mockUseCases })

    expect(app).toBeDefined()
    expect(typeof app.request).toBe('function')
  })
})
