/**
 * JobStore Interface
 * ジョブの状態管理を抽象化するインターフェース
 * 実装: InMemoryJobStore, (将来) MongoJobStore, RedisJobStore
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  name: string
  status: JobStatus
  progress: number
  createdAt: Date
  updatedAt: Date
}

export interface JobStore {
  /**
   * 新規ジョブを作成
   */
  create(name: string): Promise<Job>

  /**
   * IDでジョブを取得
   */
  get(id: string): Promise<Job | null>

  /**
   * ジョブ一覧を取得（新しい順）
   */
  list(limit?: number): Promise<Job[]>

  /**
   * ジョブのステータス/進捗を更新
   */
  update(id: string, updates: Partial<Pick<Job, 'status' | 'progress'>>): Promise<Job | null>

  /**
   * ジョブを削除
   */
  delete(id: string): Promise<boolean>
}
