import { describe, it, expect, vi } from 'vitest'
import { createApp } from '../../src/app.js'
import { createTestContainer, createMockSettingsUseCases } from '../helpers/container.js'
import type { Settings } from '../../src/domain/entities/settings.js'

describe('Settings API', () => {
  const mockSettings: Settings = {
    id: '1',
    isCloud: false,
    isStub: false,
    aiModel: 'gpt-4',
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  }

  const mockSettingsUseCases = createMockSettingsUseCases({
    get: vi.fn().mockResolvedValue(mockSettings),
    save: vi.fn().mockImplementation((input) => Promise.resolve({ id: '1', ...input, updatedAt: new Date() })),
    getHistory: vi.fn().mockResolvedValue([mockSettings])
  })

  describe('GET /settings/api', () => {
    it('should return current settings', async () => {
      const testApp = createApp(createTestContainer({ settingsUseCases: mockSettingsUseCases }))
      const res = await testApp.request('/settings/api')

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('application/json')
      const json = await res.json()
      expect(json).toHaveProperty('success', true)
      // updatedAt is converted to ISO string in response
      expect(json.data.settings.id).toBe(mockSettings.id)
      expect(json.data.settings.aiModel).toBe(mockSettings.aiModel)
      expect(json.data.settings.updatedAt).toBe(mockSettings.updatedAt.toISOString())
    })
  })

  describe('POST /settings/api', () => {
    it('should save and return updated settings', async () => {
      const testApp = createApp(createTestContainer({ settingsUseCases: mockSettingsUseCases }))

      const res = await testApp.request('/settings/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCloud: true,
          isStub: false,
          aiModel: 'claude-3'
        })
      })

      expect(res.status).toBe(201)
      expect(res.headers.get('content-type')).toContain('application/json')
      const json = await res.json()
      expect(json).toHaveProperty('success', true)
      expect(json.data.settings.isCloud).toBe(true)
      expect(json.data.settings.aiModel).toBe('claude-3')
    })
  })

  describe('GET /settings/api/history', () => {
    it('should return settings history', async () => {
      const testApp = createApp(createTestContainer({ settingsUseCases: mockSettingsUseCases }))
      const res = await testApp.request('/settings/api/history')

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('application/json')
      const json = await res.json()
      expect(json).toHaveProperty('success', true)
      expect(json.data.history).toHaveLength(1)
      // updatedAt is converted to ISO string in response
      expect(json.data.history[0].updatedAt).toBe(mockSettings.updatedAt.toISOString())
    })
  })
})
