import type { Context } from 'hono'

/**
 * 標準APIレスポンス形式
 */
export interface ApiResponse<T> {
  success: true
  data: T
}

/**
 * APIコントローラーファクトリー
 *
 * レスポンスを `{ success: true, data: result }` 形式に統一
 *
 * @example
 * export function createMicropostListController(repo: MicropostRepository) {
 *   return createApiController(async (c) => {
 *     const microposts = await listMicroposts(repo)
 *     return { microposts }
 *   })
 * }
 */
export function createApiController<T>(
  handler: (c: Context) => Promise<T>
): (c: Context) => Promise<Response> {
  return async (c: Context) => {
    const result = await handler(c)
    return c.json({ success: true, data: result })
  }
}

/**
 * ステータスコード指定可能なAPIコントローラーファクトリー
 *
 * POST/PUTなど、201等のステータスコードを返したい場合に使用
 *
 * @example
 * export function createMicropostController(repo: MicropostRepository) {
 *   return createApiControllerWithStatus(async (c) => {
 *     const micropost = await createMicropost(repo, data)
 *     return { micropost }
 *   }, 201)
 * }
 */
export function createApiControllerWithStatus<T>(
  handler: (c: Context) => Promise<T>,
  status: number = 200
): (c: Context) => Promise<Response> {
  return async (c: Context) => {
    const result = await handler(c)
    return c.json({ success: true, data: result }, status as 200 | 201)
  }
}
