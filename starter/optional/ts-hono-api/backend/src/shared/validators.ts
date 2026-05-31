/**
 * 共通バリデーションユーティリティ
 *
 * Zodスキーマを使用した汎用バリデーション
 */
import { z } from 'zod'

/**
 * バリデーション成功結果
 */
export type ValidationSuccess<T> = { success: true; data: T }

/**
 * バリデーション失敗結果
 */
export type ValidationFailure = { success: false; error: string }

/**
 * バリデーション結果
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * Zodスキーマでボディをバリデーション
 *
 * @example
 * const result = validateBody(userSchema, req.body)
 * if (!result.success) {
 *   throw Errors.badRequest(result.error)
 * }
 * const user = result.data
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.issues?.[0]
    const message = firstError?.message || 'Validation failed'
    return { success: false, error: message }
  }
  return { success: true, data: result.data }
}
