/**
 * Redis JobStore Implementation (Upstash)
 * Redis を使用したジョブストア
 * サーバー再起動後もデータが保持される
 */
import type { Redis } from '@upstash/redis'
import type { Job, JobStore, JobStatus } from '../../../domain/services/jobStore.js'

const JOB_PREFIX = 'job:'
const JOB_LIST_KEY = 'jobs:list'
const DEFAULT_TTL = 60 * 60 * 24 // 24時間

interface JobData {
  id: string
  name: string
  status: JobStatus
  progress: number
  createdAt: string
  updatedAt: string
}

function toJob(data: JobData): Job {
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    progress: data.progress,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }
}

/**
 * Redis JobStore を作成
 * @param redis Upstash Redis クライアント
 */
export function createRedisJobStore(redis: Redis): JobStore {
  return {
    async create(name: string): Promise<Job> {
      const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const job: JobData = {
        id,
        name,
        status: 'pending',
        progress: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }

      await redis.set(`${JOB_PREFIX}${id}`, JSON.stringify(job), { ex: DEFAULT_TTL })
      await redis.lpush(JOB_LIST_KEY, id)

      return toJob(job)
    },

    async get(id: string): Promise<Job | null> {
      const data = await redis.get<string>(`${JOB_PREFIX}${id}`)
      if (!data) return null

      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      return toJob(parsed)
    },

    async list(limit = 20): Promise<Job[]> {
      const ids = await redis.lrange(JOB_LIST_KEY, 0, limit - 1)
      const jobs: Job[] = []

      for (const id of ids) {
        const data = await redis.get<string>(`${JOB_PREFIX}${id}`)
        if (data) {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data
          jobs.push(toJob(parsed))
        }
      }

      return jobs
    },

    async update(id: string, updates: Partial<Pick<Job, 'status' | 'progress'>>): Promise<Job | null> {
      const data = await redis.get<string>(`${JOB_PREFIX}${id}`)
      if (!data) return null

      const job: JobData = typeof data === 'string' ? JSON.parse(data) : data
      if (updates.status !== undefined) job.status = updates.status
      if (updates.progress !== undefined) job.progress = updates.progress
      job.updatedAt = new Date().toISOString()

      await redis.set(`${JOB_PREFIX}${id}`, JSON.stringify(job), { ex: DEFAULT_TTL })
      return toJob(job)
    },

    async delete(id: string): Promise<boolean> {
      const deleted = await redis.del(`${JOB_PREFIX}${id}`)
      await redis.lrem(JOB_LIST_KEY, 1, id)
      return deleted > 0
    },
  }
}
