import { describe, it, expect, vi } from 'vitest'
import { createSettingsUseCases } from '../../../src/domain/usecases/settings/index.js'
import { createMockSettingsRepo } from '../../helpers/mocks.js'
import type { Settings } from '../../../src/domain/entities/settings.js'

describe('Settings Use Cases', () => {
  const mockSettings: Settings = {
    id: '1',
    isCloud: true,
    isStub: false,
    aiModel: 'gpt-4',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }

  describe('createSettingsUseCases', () => {
    it('should create use cases object with all methods', () => {
      const mockRepo = createMockSettingsRepo()

      const useCases = createSettingsUseCases({
        settingsRepo: mockRepo,
      })

      expect(useCases.get).toBeDefined()
      expect(useCases.save).toBeDefined()
      expect(useCases.getHistory).toBeDefined()
    })
  })

  describe('get', () => {
    it('should return current settings', async () => {
      const mockRepo = createMockSettingsRepo({
        get: vi.fn().mockResolvedValue(mockSettings)
      })

      const useCases = createSettingsUseCases({
        settingsRepo: mockRepo,
      })

      const result = await useCases.get()

      expect(result).toEqual(mockSettings)
      expect(mockRepo.get).toHaveBeenCalled()
    })
  })

  describe('save', () => {
    it('should save and return updated settings', async () => {
      const input = { isCloud: true, isStub: false, aiModel: 'claude-3' }
      const savedSettings = { id: '1', ...input, updatedAt: '2025-01-01T00:00:00.000Z' }
      const mockRepo = createMockSettingsRepo({
        save: vi.fn().mockResolvedValue(savedSettings)
      })

      const useCases = createSettingsUseCases({
        settingsRepo: mockRepo,
      })

      const result = await useCases.save(input)

      expect(result).toEqual(savedSettings)
      expect(mockRepo.save).toHaveBeenCalledWith(input)
    })
  })

  describe('getHistory', () => {
    it('should return settings history', async () => {
      const history = [
        { id: '1', isCloud: true, isStub: false, aiModel: 'gpt-4', updatedAt: '2025-01-01T00:00:00.000Z' },
        { id: '2', isCloud: false, isStub: true, aiModel: 'claude-3', updatedAt: '2025-01-02T00:00:00.000Z' }
      ]
      const mockRepo = createMockSettingsRepo({
        getHistory: vi.fn().mockResolvedValue(history)
      })

      const useCases = createSettingsUseCases({
        settingsRepo: mockRepo,
      })

      const result = await useCases.getHistory()

      expect(result).toEqual(history)
      expect(mockRepo.getHistory).toHaveBeenCalled()
    })
  })
})
