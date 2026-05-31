import { describe, it, expect, vi } from 'vitest'
import { createSettingsApiRoutes } from '../../../src/presentation/routes/settings/api.js'
import { createMockSettingsUseCases } from '../../helpers/mocks.js'

describe('createSettingsApiRoutes', () => {
  it('should return settings', async () => {
    const mockUseCases = createMockSettingsUseCases({
      get: vi.fn().mockResolvedValue({
        id: '1', isCloud: true, isStub: false, aiModel: 'gpt-4', updatedAt: new Date('2024-01-01')
      })
    })

    const app = createSettingsApiRoutes({ settingsUseCases: mockUseCases })
    const res = await app.request('/')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })
})
