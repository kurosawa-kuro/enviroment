/**
 * In-Memory JobStore Implementation
 * 開発/テスト用のメモリ内ジョブストア
 * 注意: サーバー再起動でデータは消失する
 */
import type { Job, JobStore } from '../../../domain/services/jobStore.js'

/**
 * インメモリJobStoreを作成
 */
export function createInMemoryJobStore(): JobStore {
  const jobs = new Map<string, Job>()

  return {
    async create(name: string): Promise<Job> {
      const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const job: Job = {
        id,
        name,
        status: 'pending',
        progress: 0,
        createdAt: now,
        updatedAt: now,
      }
      jobs.set(id, job)
      return job
    },

    async get(id: string): Promise<Job | null> {
      return jobs.get(id) ?? null
    },

    async list(limit = 20): Promise<Job[]> {
      return Array.from(jobs.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
    },

    async update(id: string, updates: Partial<Pick<Job, 'status' | 'progress'>>): Promise<Job | null> {
      const job = jobs.get(id)
      if (!job) return null

      if (updates.status !== undefined) {
        job.status = updates.status
      }
      if (updates.progress !== undefined) {
        job.progress = updates.progress
      }
      job.updatedAt = new Date()

      return job
    },

    async delete(id: string): Promise<boolean> {
      return jobs.delete(id)
    },
  }
}
