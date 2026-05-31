import { describe, it, expect, vi } from 'vitest'

// Mock all dependencies
vi.mock('../../../src/infra/repositories/micropost/mongo.js', () => ({
  createMicropostMongoRepository: vi.fn(() => ({ create: vi.fn(), get: vi.fn(), list: vi.fn() }))
}))
vi.mock('../../../src/infra/repositories/settings/mongo.js', () => ({
  createSettingsMongoRepository: vi.fn(() => ({ get: vi.fn(), save: vi.fn(), getHistory: vi.fn() }))
}))
vi.mock('../../../src/infra/services/fileUpload.js', () => ({
  createFileUploadService: vi.fn(() => ({ saveImage: vi.fn() }))
}))
vi.mock('../../../src/infra/services/jobStore/memory.js', () => ({
  createInMemoryJobStore: vi.fn(() => ({ create: vi.fn(), get: vi.fn(), list: vi.fn(), update: vi.fn(), delete: vi.fn() }))
}))
vi.mock('../../../src/infra/services/jobStore/redis.js', () => ({
  createRedisJobStore: vi.fn(() => ({ create: vi.fn(), get: vi.fn(), list: vi.fn(), update: vi.fn(), delete: vi.fn() }))
}))
vi.mock('../../../src/env/index.js', () => ({
  appConfig: {
    mongoDbName: 'test-db',
    mediaCloudinaryCloudName: 'test',
    mediaCloudinaryApiKey: 'key',
    mediaCloudinaryApiSecret: 'secret'
  }
}))

import { createAppContainer } from '../../../src/di/container.js'

describe('createAppContainer', () => {
  it('should create container with all dependencies', async () => {
    const mockMongoClient = { db: vi.fn() } as any
    const container = await createAppContainer(mockMongoClient, null)

    expect(container).toBeDefined()
    expect(container.resolve('micropostRepo')).toBeDefined()
    expect(container.resolve('settingsRepo')).toBeDefined()
    expect(container.resolve('fileUploadService')).toBeDefined()
    expect(container.resolve('jobStore')).toBeDefined()
  })
})
