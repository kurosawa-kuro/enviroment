/**
 * Common Mocks
 * --------------------------------
 * テスト用の共通モック定義
 *
 * 使用方法:
 * - vi.mock() はファイルの先頭で呼び出す必要がある
 * - mockFactories はテスト内で呼び出してモックを作成
 */
import { vi } from 'vitest'
import type { MicropostRepository } from '../../src/domain/repositories/micropost.js'
import type { SettingsRepository } from '../../src/domain/repositories/settings.js'
import type { FileUploadService } from '../../src/domain/services/fileUpload.js'
import type { JobStore } from '../../src/domain/services/jobStore.js'
import type { MicropostUseCases } from '../../src/domain/usecases/micropost/index.js'
import type { SettingsUseCases } from '../../src/domain/usecases/settings/index.js'
import type { JobUseCases } from '../../src/domain/usecases/job/index.js'
import type { AppConfig } from '../../src/env/index.js'

// ============================================
// Mock Factory Functions
// ============================================

/**
 * MicropostRepository のモックを作成
 * 全メソッドはvi.fn()でspy可能
 * create/updateは入力データを反映した値を返す
 */
export function createMockMicropostRepo(overrides: Partial<MicropostRepository> = {}): MicropostRepository {
  return {
    create: vi.fn().mockImplementation((data) => Promise.resolve({
      id: 'mock-id',
      title: data.title,
      body: data.body,
      creatorId: data.creatorId,
      imagePath: data.imagePath,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    get: vi.fn().mockResolvedValue({
      id: '1',
      title: 'Mock Micropost',
      body: 'Mock body',
      creatorId: 'user_dummy_creator',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation((id, data) => Promise.resolve({
      id,
      title: data.title ?? 'Mock Micropost',
      body: data.body ?? 'Mock body',
      creatorId: 'user_dummy_creator',
      imagePath: data.imagePath,
      status: data.status ?? 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides
  }
}

/**
 * SettingsRepository のモックを作成
 */
export function createMockSettingsRepo(overrides: Partial<SettingsRepository> = {}): SettingsRepository {
  return {
    get: vi.fn().mockResolvedValue({
      id: '1',
      isCloud: false,
      isStub: false,
      aiModel: 'gpt-4',
      updatedAt: new Date().toISOString()
    }),
    save: vi.fn().mockResolvedValue({
      id: '1',
      isCloud: false,
      isStub: false,
      aiModel: 'gpt-4',
      updatedAt: new Date().toISOString()
    }),
    getHistory: vi.fn().mockResolvedValue([]),
    ...overrides
  }
}

/**
 * FileUploadService のモックを作成
 */
export function createMockFileUploadService(overrides: Partial<FileUploadService> = {}): FileUploadService {
  return {
    saveImage: vi.fn().mockResolvedValue('https://res.cloudinary.com/test/image/upload/test.jpg'),
    ...overrides
  }
}

/**
 * JobStore のモックを作成
 */
export function createMockJobStore(overrides: Partial<JobStore> = {}): JobStore {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'job-1',
      name: 'Test Job',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    get: vi.fn().mockResolvedValue({
      id: 'job-1',
      name: 'Test Job',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({
      id: 'job-1',
      name: 'Test Job',
      status: 'completed',
      progress: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides
  }
}

// ============================================
// Use Case Mock Factory Functions
// ============================================

/**
 * MicropostUseCases のモックを作成
 */
export function createMockMicropostUseCases(overrides: Partial<MicropostUseCases> = {}): MicropostUseCases {
  return {
    create: vi.fn().mockImplementation(({ input }) => Promise.resolve({
      id: 'mock-id',
      title: input.title,
      body: input.body,
      creatorId: input.creatorId,
      imagePath: input.imagePath,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    get: vi.fn().mockResolvedValue({
      id: '1',
      title: 'Mock Micropost',
      body: 'Mock body',
      creatorId: 'user_dummy_creator',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(({ id, input }) => Promise.resolve({
      id,
      title: input.title ?? 'Mock Micropost',
      body: input.body ?? 'Mock body',
      creatorId: 'user_dummy_creator',
      imagePath: input.imagePath,
      status: input.status ?? 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides
  }
}

/**
 * SettingsUseCases のモックを作成
 */
export function createMockSettingsUseCases(overrides: Partial<SettingsUseCases> = {}): SettingsUseCases {
  return {
    get: vi.fn().mockResolvedValue({
      id: '1',
      isCloud: false,
      isStub: false,
      aiModel: 'gpt-4',
      updatedAt: new Date().toISOString()
    }),
    save: vi.fn().mockImplementation((input) => Promise.resolve({
      id: '1',
      ...input,
      updatedAt: new Date().toISOString()
    })),
    getHistory: vi.fn().mockResolvedValue([]),
    ...overrides
  }
}

/**
 * JobUseCases のモックを作成
 */
export function createMockJobUseCases(overrides: Partial<JobUseCases> = {}): JobUseCases {
  return {
    create: vi.fn().mockImplementation(({ name }) => Promise.resolve({
      id: 'job-1',
      name,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    get: vi.fn().mockResolvedValue({
      id: 'job-1',
      name: 'Test Job',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(({ id, updates }) => Promise.resolve({
      id,
      name: 'Test Job',
      status: updates.status ?? 'pending',
      progress: updates.progress ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides
  }
}

/**
 * AppConfig のモックを作成
 */
export function createMockAppConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    projectName: 'test-app',
    env: 'test',
    port: 3000,
    logLevel: 'info',
    mongodbUri: 'mongodb://localhost:27017',
    mongoDbName: 'test-db',
    authEnabled: false,
    authClerkPublishableKey: '',
    authClerkSecretKey: '',
    internalApiKey: '',
    mediaCloudinaryCloudName: 'test',
    mediaCloudinaryApiKey: 'key',
    mediaCloudinaryApiSecret: 'secret',
    redisUrl: undefined,
    ...overrides
  } as AppConfig
}

// ============================================
// vi.mock Setup Helpers
// ============================================

/**
 * vi.mock用のrender.jsモック定義
 * 使用: vi.mock('../../../src/presentation/helpers/render.js', () => renderMock)
 */
export const renderMock = {
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}

/**
 * vi.mock用のejs モック定義
 * 使用: vi.mock('ejs', () => ejsMock)
 */
export const ejsMock = {
  renderFile: vi.fn().mockResolvedValue('<html><body>Test</body></html>')
}

/**
 * vi.mock用のclerk-auth モック定義
 * 使用: vi.mock('@hono/clerk-auth', () => clerkAuthMock)
 */
export const clerkAuthMock = {
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => next()),
  getAuth: vi.fn(() => null)
}

/**
 * vi.mock用の認証済みclerk-auth モック定義
 */
export const clerkAuthenticatedMock = {
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => next()),
  getAuth: vi.fn(() => ({ userId: 'user_authenticated' }))
}
