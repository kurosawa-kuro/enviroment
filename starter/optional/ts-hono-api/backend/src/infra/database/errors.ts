/**
 * Database Error Utilities
 * DB操作のエラーをドメインエラーに変換するユーティリティ
 */
import { Errors } from '../../shared/errors.js'

/**
 * DB操作をラップし、エラー発生時に AppError に変換する
 * @param operation 実行するDB操作
 * @param context エラーメッセージに含めるコンテキスト情報
 */
export async function wrapDbOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (err) {
    throw Errors.dbUnavailable(context, err)
  }
}
