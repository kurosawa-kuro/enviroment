import { describe, it, expect, vi } from 'vitest'

// Mock @upstash/redis module with class
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    url: string
    token: string
    constructor(config: { url: string; token: string }) {
      this.url = config.url
      this.token = config.token
    }
  }
}))

import { createRedisClient } from '../../../src/infra/database/clients/redis.js'

describe('createRedisClient', () => {
  it('should create Redis client with provided config', () => {
    const config = {
      url: 'https://test-redis.upstash.io',
      token: 'test-token-123'
    }

    const client = createRedisClient(config)

    expect(client).toBeDefined()
    expect((client as any).url).toBe(config.url)
    expect((client as any).token).toBe(config.token)
  })

  it('should create separate instances for different configs', () => {
    const config1 = { url: 'https://redis1.upstash.io', token: 'token1' }
    const config2 = { url: 'https://redis2.upstash.io', token: 'token2' }

    const client1 = createRedisClient(config1)
    const client2 = createRedisClient(config2)

    expect(client1).not.toBe(client2)
    expect((client1 as any).url).toBe(config1.url)
    expect((client2 as any).url).toBe(config2.url)
  })
})
