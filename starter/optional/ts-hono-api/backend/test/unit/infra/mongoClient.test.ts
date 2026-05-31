import { describe, it, expect, vi } from 'vitest'

// Mock mongodb
vi.mock('mongodb', () => ({
  MongoClient: class MockMongoClient {
    uri: string
    options: Record<string, unknown>
    constructor(uri: string, options?: Record<string, unknown>) {
      this.uri = uri
      this.options = options || {}
    }
  }
}))

import { createMongoClient } from '../../../src/infra/database/clients/mongo.js'

describe('createMongoClient', () => {
  it('should create MongoClient with default options', () => {
    const client = createMongoClient('mongodb://localhost:27017')

    expect((client as any).uri).toBe('mongodb://localhost:27017')
    expect((client as any).options.serverSelectionTimeoutMS).toBe(5000)
    expect((client as any).options.connectTimeoutMS).toBe(10000)
  })

  it('should create MongoClient with custom options', () => {
    const client = createMongoClient('mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 3000
    } as any)

    expect((client as any).options.serverSelectionTimeoutMS).toBe(3000)
  })
})
