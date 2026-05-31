/**
 * MongoDB Client Factory
 * 状態を持たない純粋なクライアント生成関数
 * ライフサイクル管理は呼び出し側（index.ts）で行う
 */
import { MongoClient, type MongoClientOptions } from 'mongodb'

export interface MongoClientConfig {
  serverSelectionTimeoutMS?: number
  connectTimeoutMS?: number
}

const DEFAULT_OPTIONS: MongoClientConfig = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
}

/**
 * MongoClientを生成する（接続は行わない）
 * @param uri MongoDB接続URI
 * @param options MongoClientオプション
 */
export function createMongoClient(
  uri: string,
  options?: MongoClientOptions
): MongoClient {
  return new MongoClient(uri, {
    ...DEFAULT_OPTIONS,
    ...options,
  })
}
