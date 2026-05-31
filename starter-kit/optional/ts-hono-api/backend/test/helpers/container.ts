/**
 * Test Container
 * --------------------------------
 * テスト用のDIコンテナを作成
 *
 * 使用方法:
 * - createTestContainer(): デフォルトのモック依存でコンテナ作成
 * - createTestContainer({ micropostUseCases: customUseCases }): 特定の依存を上書き
 *
 * モックのカスタマイズ:
 * - mocks.tsのFactory関数を使用: createMockMicropostUseCases({ get: vi.fn().mockResolvedValue(null) })
 */
import { createContainer, asValue, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { Cradle } from '../../src/di/container.js'
import type { MicropostRepository } from '../../src/domain/repositories/micropost.js'
import type { SettingsRepository } from '../../src/domain/repositories/settings.js'
import type { FileUploadService } from '../../src/domain/services/fileUpload.js'
import type { JobStore } from '../../src/domain/services/jobStore.js'
import type { MicropostUseCases } from '../../src/domain/usecases/micropost/index.js'
import type { SettingsUseCases } from '../../src/domain/usecases/settings/index.js'
import type { JobUseCases } from '../../src/domain/usecases/job/index.js'
import {
  createMockMicropostRepo,
  createMockSettingsRepo,
  createMockFileUploadService,
  createMockJobStore,
  createMockMicropostUseCases,
  createMockSettingsUseCases,
  createMockJobUseCases,
} from './mocks.js'

export interface TestContainerOptions {
  // Repositories (internal use)
  micropostRepo?: MicropostRepository
  settingsRepo?: SettingsRepository
  fileUploadService?: FileUploadService
  jobStore?: JobStore
  // Use Cases (primary interface)
  micropostUseCases?: MicropostUseCases
  settingsUseCases?: SettingsUseCases
  jobUseCases?: JobUseCases
}

/**
 * テスト用DIコンテナを作成
 * デフォルトでmocks.tsのFactory関数で生成したモックを使用
 *
 * PROXY モード対応:
 * - テストでは既に構築済みのモックを asValue で登録
 * - 本番と同じ InjectionMode.PROXY を使用
 */
export function createTestContainer(options: TestContainerOptions = {}): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
  })

  container.register({
    // Clients (null for tests)
    mongoClient: asValue(null as any),
    redisClient: asValue(null),

    // Config values (テスト用ダミー)
    mongoDbName: asValue('test-db'),
    cloudinaryConfig: asValue({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    }),

    // Repositories (asValue: 既に構築済みのモック)
    micropostRepo: asValue(options.micropostRepo ?? createMockMicropostRepo()),
    settingsRepo: asValue(options.settingsRepo ?? createMockSettingsRepo()),

    // Services (asValue: 既に構築済みのモック)
    fileUploadService: asValue(options.fileUploadService ?? createMockFileUploadService()),
    jobStore: asValue(options.jobStore ?? createMockJobStore()),

    // Use Cases (asValue: 既に構築済みのモック)
    micropostUseCases: asValue(options.micropostUseCases ?? createMockMicropostUseCases()),
    settingsUseCases: asValue(options.settingsUseCases ?? createMockSettingsUseCases()),
    jobUseCases: asValue(options.jobUseCases ?? createMockJobUseCases()),
  })

  return container
}

// Re-export factories for convenience
export {
  createMockMicropostRepo,
  createMockSettingsRepo,
  createMockFileUploadService,
  createMockJobStore,
  createMockMicropostUseCases,
  createMockSettingsUseCases,
  createMockJobUseCases,
} from './mocks.js'
