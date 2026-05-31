/**
 * Redis Client Factory (Upstash)
 * 状態を持たない純粋なクライアント生成関数
 * Upstash Redis は HTTP ベースのため明示的な close は不要
 */
import { Redis } from '@upstash/redis'

export interface RedisClientConfig {
  url: string
  token: string
}

/**
 * Upstash Redis クライアントを生成
 * @param config Redis接続設定（url と token が必要）
 */
export function createRedisClient(config: RedisClientConfig): Redis {
  return new Redis({
    url: config.url,
    token: config.token,
  })
}
