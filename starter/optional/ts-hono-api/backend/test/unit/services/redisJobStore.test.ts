import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRedisJobStore } from '../../../src/infra/services/jobStore/redis.js'
import type { Redis } from '@upstash/redis'

// Mock Redis client
function createMockRedis() {
  const store = new Map<string, string>()
  const lists = new Map<string, string[]>()

  return {
    store,
    lists,
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
      return 'OK'
    }),
    get: vi.fn(async <T>(key: string): Promise<T | null> => {
      return (store.get(key) as T) || null
    }),
    del: vi.fn(async (key: string) => {
      const existed = store.has(key)
      store.delete(key)
      return existed ? 1 : 0
    }),
    lpush: vi.fn(async (key: string, ...values: string[]) => {
      const list = lists.get(key) || []
      list.unshift(...values)
      lists.set(key, list)
      return list.length
    }),
    lrange: vi.fn(async (key: string, start: number, stop: number) => {
      const list = lists.get(key) || []
      return list.slice(start, stop + 1)
    }),
    lrem: vi.fn(async (key: string, count: number, value: string) => {
      const list = lists.get(key) || []
      const index = list.indexOf(value)
      if (index > -1) {
        list.splice(index, 1)
        lists.set(key, list)
        return 1
      }
      return 0
    }),
  }
}

describe('RedisJobStore', () => {
  let mockRedis: ReturnType<typeof createMockRedis>
  let jobStore: ReturnType<typeof createRedisJobStore>

  beforeEach(() => {
    mockRedis = createMockRedis()
    jobStore = createRedisJobStore(mockRedis as unknown as Redis)
  })

  describe('create', () => {
    it('should create a new job with pending status', async () => {
      const job = await jobStore.create('test-job')

      expect(job.id).toMatch(/^job_\d+_[a-z0-9]+$/)
      expect(job.name).toBe('test-job')
      expect(job.status).toBe('pending')
      expect(job.progress).toBe(0)
      expect(job.createdAt).toBeInstanceOf(Date)
      expect(job.updatedAt).toBeInstanceOf(Date)
    })

    it('should store job in Redis with TTL', async () => {
      await jobStore.create('test-job')

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^job:job_\d+_[a-z0-9]+$/),
        expect.any(String),
        { ex: 86400 }
      )
    })

    it('should add job id to list', async () => {
      await jobStore.create('test-job')

      expect(mockRedis.lpush).toHaveBeenCalledWith(
        'jobs:list',
        expect.stringMatching(/^job_\d+_[a-z0-9]+$/)
      )
    })
  })

  describe('get', () => {
    it('should return job by id', async () => {
      const created = await jobStore.create('test-job')
      const retrieved = await jobStore.get(created.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.name).toBe('test-job')
    })

    it('should return null for non-existent job', async () => {
      const result = await jobStore.get('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return jobs in order', async () => {
      const job1 = await jobStore.create('job-1')
      const job2 = await jobStore.create('job-2')
      const job3 = await jobStore.create('job-3')

      const jobs = await jobStore.list()

      expect(jobs).toHaveLength(3)
      expect(jobs[0].id).toBe(job3.id)
      expect(jobs[1].id).toBe(job2.id)
      expect(jobs[2].id).toBe(job1.id)
    })

    it('should respect limit parameter', async () => {
      await jobStore.create('job-1')
      await jobStore.create('job-2')
      await jobStore.create('job-3')

      const jobs = await jobStore.list(2)

      expect(jobs).toHaveLength(2)
      expect(mockRedis.lrange).toHaveBeenCalledWith('jobs:list', 0, 1)
    })

    it('should return empty array when no jobs exist', async () => {
      const jobs = await jobStore.list()

      expect(jobs).toEqual([])
    })
  })

  describe('update', () => {
    it('should update job status', async () => {
      const created = await jobStore.create('test-job')
      const updated = await jobStore.update(created.id, { status: 'processing' })

      expect(updated).not.toBeNull()
      expect(updated!.status).toBe('processing')
    })

    it('should update job progress', async () => {
      const created = await jobStore.create('test-job')
      const updated = await jobStore.update(created.id, { progress: 50 })

      expect(updated).not.toBeNull()
      expect(updated!.progress).toBe(50)
    })

    it('should update both status and progress', async () => {
      const created = await jobStore.create('test-job')
      const updated = await jobStore.update(created.id, {
        status: 'completed',
        progress: 100
      })

      expect(updated).not.toBeNull()
      expect(updated!.status).toBe('completed')
      expect(updated!.progress).toBe(100)
    })

    it('should update updatedAt timestamp', async () => {
      const created = await jobStore.create('test-job')

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await jobStore.update(created.id, { progress: 25 })

      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime())
    })

    it('should return null for non-existent job', async () => {
      const result = await jobStore.update('non-existent-id', { status: 'completed' })

      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete existing job and return true', async () => {
      const created = await jobStore.create('test-job')
      const result = await jobStore.delete(created.id)

      expect(result).toBe(true)
      expect(mockRedis.del).toHaveBeenCalledWith(`job:${created.id}`)
      expect(mockRedis.lrem).toHaveBeenCalledWith('jobs:list', 1, created.id)
    })

    it('should return false for non-existent job', async () => {
      const result = await jobStore.delete('non-existent-id')

      expect(result).toBe(false)
    })

    it('should remove job from list', async () => {
      const job1 = await jobStore.create('job-1')
      const job2 = await jobStore.create('job-2')

      await jobStore.delete(job1.id)
      const jobs = await jobStore.list()

      expect(jobs).toHaveLength(1)
      expect(jobs[0].id).toBe(job2.id)
    })
  })
})
