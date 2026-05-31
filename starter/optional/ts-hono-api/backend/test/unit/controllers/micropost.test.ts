import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import {
  createMicropostListController,
  createMicropostGetController,
  createMicropostCreateController,
  createMicropostListPageController
} from '../../../src/presentation/controllers/dashboard/micropost.js'
import { createMockMicropostUseCases, createMockAppConfig } from '../../helpers/mocks.js'
import { errorHandler } from '../../../src/presentation/middleware/errorHandler.js'

// Mock render for page controllers
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

// Mock getCurrentUserId
const mockGetCurrentUserId = vi.fn()
vi.mock('../../../src/presentation/middleware/auth/index.js', () => ({
  getCurrentUserId: (...args: unknown[]) => mockGetCurrentUserId(...args)
}))

describe('createMicropostListController', () => {
  it('should return microposts list', async () => {
    const mockUseCases = createMockMicropostUseCases({
      list: vi.fn().mockResolvedValue([
        { id: '1', title: 'Post 1', body: 'Body 1', creatorId: 'user1', status: 'published', createdAt: new Date(), updatedAt: new Date() }
      ])
    })

    const app = new Hono()
    app.get('/microposts', createMicropostListController(mockUseCases))

    const res = await app.request('/microposts')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.microposts).toHaveLength(1)
  })
})

describe('createMicropostGetController', () => {
  it('should return a micropost by id', async () => {
    const mockUseCases = createMockMicropostUseCases({
      get: vi.fn().mockResolvedValue({
        id: '1', title: 'Post 1', body: 'Body 1', creatorId: 'user1', status: 'published', createdAt: new Date(), updatedAt: new Date()
      })
    })

    const app = new Hono()
    app.get('/microposts/:id', createMicropostGetController(mockUseCases))

    const res = await app.request('/microposts/1')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.micropost.title).toBe('Post 1')
  })
})

describe('createMicropostCreateController', () => {
  beforeEach(() => {
    mockGetCurrentUserId.mockReset()
  })

  it('should use default creator ID when auth is disabled', async () => {
    const mockUseCases = createMockMicropostUseCases()
    const mockConfig = createMockAppConfig({ authEnabled: false })
    mockGetCurrentUserId.mockReturnValue(null)

    const app = new Hono()
    app.post('/microposts', createMicropostCreateController(mockUseCases, mockConfig))

    const formData = new FormData()
    formData.append('title', 'Test Title')
    formData.append('body', 'Test Body')
    formData.append('status', 'draft')

    const res = await app.request('/microposts', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(mockUseCases.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          creatorId: 'user_dummy_creator'
        })
      })
    )
  })

  it('should use Clerk user ID when auth is enabled and user is authenticated', async () => {
    const mockUseCases = createMockMicropostUseCases()
    const mockConfig = createMockAppConfig({ authEnabled: true })
    mockGetCurrentUserId.mockReturnValue('user_clerk_123')

    const app = new Hono()
    app.post('/microposts', createMicropostCreateController(mockUseCases, mockConfig))

    const formData = new FormData()
    formData.append('title', 'Test Title')
    formData.append('body', 'Test Body')
    formData.append('status', 'draft')

    const res = await app.request('/microposts', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(mockUseCases.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          creatorId: 'user_clerk_123'
        })
      })
    )
  })

  it('should fallback to default creator ID when getCurrentUserId returns null', async () => {
    const mockUseCases = createMockMicropostUseCases()
    const mockConfig = createMockAppConfig({ authEnabled: true })
    mockGetCurrentUserId.mockReturnValue(null)

    const app = new Hono()
    app.post('/microposts', createMicropostCreateController(mockUseCases, mockConfig))

    const formData = new FormData()
    formData.append('title', 'Test Title')
    formData.append('body', 'Test Body')
    formData.append('status', 'draft')

    const res = await app.request('/microposts', {
      method: 'POST',
      body: formData
    })

    expect(res.status).toBe(201)
    expect(mockUseCases.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          creatorId: 'user_dummy_creator'
        })
      })
    )
  })

  it('should return 400 for invalid input', async () => {
    const mockUseCases = createMockMicropostUseCases()
    const mockConfig = createMockAppConfig()

    const app = new Hono()
    app.onError(errorHandler)
    app.post('/microposts', createMicropostCreateController(mockUseCases, mockConfig))

    const formData = new FormData()
    formData.append('title', '') // Empty title should fail validation
    formData.append('body', '')

    const res = await app.request('/microposts', {
      method: 'POST',
      body: formData
    })

    expect(res.status).toBe(400)
  })
})

describe('createMicropostListPageController', () => {
  it('should return a controller function', () => {
    const controller = createMicropostListPageController()

    expect(typeof controller).toBe('function')
  })
})
