import type { Job, JobStatus } from '../../services/jobStore.js'

/**
 * Job作成パラメータ
 */
export interface CreateJobParams {
  name: string
}

/**
 * Job更新パラメータ
 */
export interface UpdateJobParams {
  id: string
  updates: Partial<Pick<Job, 'status' | 'progress'>>
}

/**
 * JobUseCases Interface
 * DIコンテナに登録され、Controllerから使用される主要インターフェース
 */
export interface JobUseCases {
  create: (params: CreateJobParams) => Promise<Job>
  get: (id: string) => Promise<Job | null>
  list: (limit?: number) => Promise<Job[]>
  update: (params: UpdateJobParams) => Promise<Job | null>
  delete: (id: string) => Promise<boolean>
}

// Re-export for convenience
export type { Job, JobStatus }
