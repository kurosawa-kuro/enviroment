import { describe, it, expect, vi } from 'vitest'
import { createMicropostApiRoutes } from '../../../src/presentation/routes/dashboard/micropost/api.js'
import { createMockMicropostUseCases } from '../../helpers/mocks.js'

describe('createMicropostApiRoutes', () => {
  it('should return microposts list', async () => {
    const mockUseCases = createMockMicropostUseCases({
      list: vi.fn().mockResolvedValue([
        { id: '1', title: 'Test', body: 'Body', creatorId: 'user1', status: 'published', createdAt: new Date(), updatedAt: new Date() }
      ])
    })
    const mockApiKeyAuth = vi.fn(async (_c: any, next: any) => next())

    const app = createMicropostApiRoutes({
      micropostUseCases: mockUseCases,
      apiKeyAuth: mockApiKeyAuth
    })

    const res = await app.request('/')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })
})
