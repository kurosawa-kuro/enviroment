import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import {
  createSettingsGetController,
  createSettingsSaveController,
  createSettingsHistoryController
} from '../../../src/presentation/controllers/settings/api.js'
import { createMockSettingsRepo } from '../../helpers/mocks.js'

describe('createSettingsGetController', () => {
  it('should return settings', async () => {
    const mockRepo = createMockSettingsRepo({
      get: vi.fn().mockResolvedValue({
        id: '1',
        isCloud: true,
        isStub: false,
        aiModel: 'gpt-4',
        updatedAt: new Date('2024-01-01'),
      })
    })

    const app = new Hono()
    app.get('/settings', createSettingsGetController(mockRepo))

    const res = await app.request('/settings')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.settings.aiModel).toBe('gpt-4')
  })
})

describe('createSettingsSaveController', () => {
  it('should save settings', async () => {
    const mockRepo = createMockSettingsRepo({
      save: vi.fn().mockResolvedValue({
        id: '2',
        isCloud: false,
        isStub: true,
        aiModel: 'claude-3',
        updatedAt: new Date('2024-01-02'),
      })
    })

    const app = new Hono()
    app.post('/settings', createSettingsSaveController(mockRepo))

    const res = await app.request('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCloud: false, isStub: true, aiModel: 'claude-3' })
    })
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.settings.aiModel).toBe('claude-3')
  })
})

describe('createSettingsHistoryController', () => {
  it('should return settings history', async () => {
    const mockRepo = createMockSettingsRepo({
      getHistory: vi.fn().mockResolvedValue([
        { id: '1', isCloud: true, isStub: false, aiModel: 'gpt-4', updatedAt: new Date('2024-01-01') },
      ])
    })

    const app = new Hono()
    app.get('/history', createSettingsHistoryController(mockRepo))

    const res = await app.request('/history')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.history).toHaveLength(1)
  })
})
