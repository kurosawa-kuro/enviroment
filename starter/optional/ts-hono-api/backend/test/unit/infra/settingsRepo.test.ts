import { describe, it, expect, vi } from 'vitest'
import { createSettingsMongoRepository } from '../../../src/infra/repositories/settings/mongo.js'

// Mock mongodb
vi.mock('mongodb', () => ({
  MongoClient: class MockMongoClient {
    db() {
      return {
        collection: () => ({
          findOne: vi.fn().mockResolvedValue({
            settingsId: '1',
            isCloud: true,
            isStub: false,
            aiModel: 'gpt-4',
            updatedAt: '2024-01-01'
          }),
          updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
          insertOne: vi.fn(),
          find: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([])
              })
            })
          }),
          countDocuments: vi.fn().mockResolvedValue(0),
          deleteMany: vi.fn()
        })
      }
    }
  }
}))

describe('createSettingsMongoRepository', () => {
  it('should create repository with get method', () => {
    const mockClient = { db: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn(),
        updateOne: vi.fn(),
        insertOne: vi.fn(),
        find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ toArray: vi.fn() }) }) }),
        countDocuments: vi.fn(),
        deleteMany: vi.fn()
      })
    }) } as any

    const repo = createSettingsMongoRepository({ mongoClient: mockClient, mongoDbName: 'test-db' })

    expect(typeof repo.get).toBe('function')
    expect(typeof repo.save).toBe('function')
    expect(typeof repo.getHistory).toBe('function')
  })
})
