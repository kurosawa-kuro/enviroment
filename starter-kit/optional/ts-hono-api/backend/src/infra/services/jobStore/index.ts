/**
 * JobStore Factory
 * Redis が利用可能な場合は Redis 実装、なければ InMemory 実装を返す
 */
import type { Redis } from '@upstash/redis'
import type { JobStore } from '../../../domain/services/jobStore.js'
import { createInMemoryJobStore } from './memory.js'
import { createRedisJobStore } from './redis.js'

interface JobStoreDeps {
  redisClient: Redis | null
}

export function createJobStore({ redisClient }: JobStoreDeps): JobStore {
  return redisClient ? createRedisJobStore(redisClient) : createInMemoryJobStore()
}
