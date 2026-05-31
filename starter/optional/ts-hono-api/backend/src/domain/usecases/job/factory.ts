import type { JobStore } from '../../services/jobStore.js'
import type { JobUseCases } from './types.js'

/**
 * JobUseCasesの依存関係
 */
export interface JobUseCasesDeps {
  jobStore: JobStore
}

/**
 * JobUseCases Factory
 * DIコンテナから依存関係を受け取り、UseCasesオブジェクトを生成
 */
export function createJobUseCases(deps: JobUseCasesDeps): JobUseCases {
  const { jobStore } = deps

  return {
    create: ({ name }) => jobStore.create(name),
    get: (id) => jobStore.get(id),
    list: (limit) => jobStore.list(limit),
    update: ({ id, updates }) => jobStore.update(id, updates),
    delete: (id) => jobStore.delete(id),
  }
}
