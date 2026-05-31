/**
 * DI Container
 * --------------------------------
 * 全依存の登録・解決を一元管理
 *
 * 設計方針:
 * - InjectionMode.PROXY: 自動依存解決 + 遅延初期化
 * - asFunction: ファクトリ関数をそのまま登録、Awilix が Cradle から自動注入
 * - ライフサイクル: 非同期リソース(mongoClient)の破棄は呼び出し側で管理
 *
 * 拡張指針:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ 1. 横断境界の独立                                                │
 * │    Auth / FeatureFlag / Job / External API は別モジュールへ分離  │
 * │                                                                  │
 * │ 2. Container分割（規模拡大時）                                   │
 * │    - infraContainer: DB clients, External adapters               │
 * │    - domainContainer: Repositories, Domain services              │
 * │    - appContainer: UseCases, Application services                │
 * │                                                                  │
 * │ 3. Request Scoping（必要時）                                     │
 * │    container.createScope() でリクエスト単位の依存管理            │
 * └─────────────────────────────────────────────────────────────────┘
 */
import { createContainer, asValue, asFunction, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { MongoClient } from 'mongodb'
import type { Redis } from '@upstash/redis'
import type { MicropostRepository } from '../domain/repositories/micropost.js'
import type { SettingsRepository } from '../domain/repositories/settings.js'
import type { FileUploadService } from '../domain/services/fileUpload.js'
import type { JobStore } from '../domain/services/jobStore.js'
import type { CloudinaryConfig } from '../infra/services/fileUpload.js'

// Use Case types
import type { MicropostUseCases } from '../domain/usecases/micropost/index.js'
import type { SettingsUseCases } from '../domain/usecases/settings/index.js'
import type { JobUseCases } from '../domain/usecases/job/index.js'

// Factory functions (PROXY mode: Awilix が Cradle のプロパティ名に基づき自動注入)
import { createMicropostMongoRepository } from '../infra/repositories/micropost/mongo.js'
import { createSettingsMongoRepository } from '../infra/repositories/settings/mongo.js'
import { createFileUploadService } from '../infra/services/fileUpload.js'
import { createJobStore } from '../infra/services/jobStore/index.js'

// Use Case factories
import { createMicropostUseCases } from '../domain/usecases/micropost/index.js'
import { createSettingsUseCases } from '../domain/usecases/settings/index.js'
import { createJobUseCases } from '../domain/usecases/job/index.js'

import { appConfig } from '../env/index.js'

/**
 * DI Container の型定義
 * システム全体の依存一覧 = この型定義
 */
export interface Cradle {
  // Database clients (asValue: 外部から渡される)
  mongoClient: MongoClient
  redisClient: Redis | null

  // Config values (asValue: ファクトリが参照)
  mongoDbName: string
  cloudinaryConfig: CloudinaryConfig

  // Repositories (asFunction: 自動解決)
  micropostRepo: MicropostRepository
  settingsRepo: SettingsRepository

  // Services (asFunction: 自動解決)
  fileUploadService: FileUploadService
  jobStore: JobStore

  // Use Cases (asFunction: 自動解決)
  micropostUseCases: MicropostUseCases
  settingsUseCases: SettingsUseCases
  jobUseCases: JobUseCases
}

/**
 * 本番用コンテナの作成
 * MongoClient / RedisClient は外部から受け取る（ライフサイクルは呼び出し側で管理）
 */
export async function createAppContainer(
  mongoClient: MongoClient,
  redisClient: Redis | null = null
): Promise<AwilixContainer<Cradle>> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
  })

  const { mongoDbName, mediaCloudinaryCloudName, mediaCloudinaryApiKey, mediaCloudinaryApiSecret } = appConfig

  container.register({
    // Clients (asValue: 外部から渡される値)
    mongoClient: asValue(mongoClient),
    redisClient: asValue(redisClient),

    // Config values (asValue: ファクトリが参照する設定)
    mongoDbName: asValue(mongoDbName),
    cloudinaryConfig: asValue({
      cloudName: mediaCloudinaryCloudName,
      apiKey: mediaCloudinaryApiKey,
      apiSecret: mediaCloudinaryApiSecret,
    }),

    // Repositories (asFunction: Awilix が Cradle から自動注入)
    micropostRepo: asFunction(createMicropostMongoRepository).singleton(),
    settingsRepo: asFunction(createSettingsMongoRepository).singleton(),

    // Services (asFunction)
    fileUploadService: asFunction(createFileUploadService).singleton(),
    jobStore: asFunction(createJobStore).singleton(),

    // Use Cases (asFunction)
    micropostUseCases: asFunction(createMicropostUseCases).singleton(),
    settingsUseCases: asFunction(createSettingsUseCases).singleton(),
    jobUseCases: asFunction(createJobUseCases).singleton(),
  })

  return container
}
