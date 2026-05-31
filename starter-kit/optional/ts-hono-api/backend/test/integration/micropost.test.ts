import { describe, it, expect, vi } from 'vitest'
import { createApp } from '../../src/app.js'
import { createTestContainer, createMockMicropostUseCases } from '../helpers/container.js'
import type { Micropost } from '../../src/domain/entities/micropost.js'

describe('Micropost Integration Tests', () => {
  const mockMicropost: Micropost = {
    id: '123',
    title: 'Test Title',
    body: 'Test body content',
    creatorId: 'user_dummy_creator',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('Page Routes', () => {
    it('GET /dashboard/microposts should return HTML page', async () => {
      const app = createApp(createTestContainer())
      const res = await app.request('/dashboard/microposts')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('Microposts')
    })

    it('GET /dashboard/microposts/new should return HTML page', async () => {
      const app = createApp(createTestContainer())
      const res = await app.request('/dashboard/microposts/new')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('Create Micropost')
    })

    it('GET /dashboard/microposts/:id should return HTML page', async () => {
      const app = createApp(createTestContainer())
      const res = await app.request('/dashboard/microposts/123')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('Micropost Detail')
    })

    it('GET /dashboard/microposts/:id/edit should return HTML page', async () => {
      const app = createApp(createTestContainer())
      const res = await app.request('/dashboard/microposts/123/edit')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('Edit Micropost')
    })
  })

  describe('API Routes', () => {
    const apiHeaders = { 'Accept': 'application/json' }

    it('GET /dashboard/microposts/api should return JSON', async () => {
      const app = createApp(createTestContainer())
      const res = await app.request('/dashboard/microposts/api', {
        headers: apiHeaders,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('microposts')
      expect(Array.isArray(data.data.microposts)).toBe(true)
    })

    it('GET /dashboard/microposts/api with status filter', async () => {
      const customUseCases = createMockMicropostUseCases({
        list: vi.fn().mockImplementation((filters) =>
          Promise.resolve(filters?.status === 'draft' ? [mockMicropost] : [])
        )
      })
      const app = createApp(createTestContainer({ micropostUseCases: customUseCases }))

      const res = await app.request('/dashboard/microposts/api?status=draft', {
        headers: apiHeaders,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('success', true)
      expect(data.data).toHaveProperty('microposts')
      expect(data.data.microposts.length).toBe(1)
    })

    it('GET /dashboard/microposts/api/:id should return 404 for non-existent', async () => {
      const customUseCases = createMockMicropostUseCases({
        get: vi.fn().mockResolvedValue(null)
      })
      const app = createApp(createTestContainer({ micropostUseCases: customUseCases }))

      const res = await app.request('/dashboard/microposts/api/000000000000000000000000', {
        headers: apiHeaders,
      })
      expect(res.status).toBe(404)
    })

    it('POST /dashboard/microposts/api should create micropost', async () => {
      const app = createApp(createTestContainer())
      const formData = new FormData()
      formData.append('title', 'Test Title')
      formData.append('body', 'Test body content')
      formData.append('status', 'draft')

      const res = await app.request('/dashboard/microposts/api', {
        method: 'POST',
        headers: apiHeaders,
        body: formData,
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data).toHaveProperty('success', true)
      expect(data.data).toHaveProperty('micropost')
      expect(data.data.micropost.title).toBe('Test Title')
      expect(data.data.micropost.body).toBe('Test body content')
      expect(data.data.micropost.status).toBe('draft')
      expect(data.data.micropost.creatorId).toBe('user_dummy_creator')
    })

    it('POST /dashboard/microposts/api should validate required fields', async () => {
      const app = createApp(createTestContainer())
      const formData = new FormData()
      formData.append('title', '')
      formData.append('body', '')

      const res = await app.request('/dashboard/microposts/api', {
        method: 'POST',
        headers: apiHeaders,
        body: formData,
      })

      expect(res.status).toBe(400)
    })

    it('POST /dashboard/microposts/api should default status to draft', async () => {
      const app = createApp(createTestContainer())
      const formData = new FormData()
      formData.append('title', 'Another Title')
      formData.append('body', 'Another body content')

      const res = await app.request('/dashboard/microposts/api', {
        method: 'POST',
        headers: apiHeaders,
        body: formData,
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.micropost.status).toBe('draft')
    })

    it('PUT /dashboard/microposts/api/:id should update micropost', async () => {
      const app = createApp(createTestContainer())
      const formData = new FormData()
      formData.append('title', 'Updated Title')
      formData.append('body', 'Updated body')
      formData.append('status', 'published')

      const res = await app.request('/dashboard/microposts/api/123', {
        method: 'PUT',
        headers: apiHeaders,
        body: formData,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('success', true)
      expect(data.data).toHaveProperty('micropost')
      expect(data.data.micropost.title).toBe('Updated Title')
    })

    it('PUT /dashboard/microposts/api/:id should return 404 for non-existent', async () => {
      const customUseCases = createMockMicropostUseCases({
        update: vi.fn().mockResolvedValue(null)
      })
      const app = createApp(createTestContainer({ micropostUseCases: customUseCases }))
      const formData = new FormData()
      formData.append('title', 'Updated Title')
      formData.append('body', 'Updated body')
      formData.append('status', 'draft')

      const res = await app.request('/dashboard/microposts/api/000000000000000000000000', {
        method: 'PUT',
        headers: apiHeaders,
        body: formData,
      })

      expect(res.status).toBe(404)
    })

    it('DELETE /dashboard/microposts/api/:id should delete micropost', async () => {
      const app = createApp(createTestContainer())

      const res = await app.request('/dashboard/microposts/api/123', {
        method: 'DELETE',
        headers: apiHeaders,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message', 'Micropost deleted')
    })

    it('DELETE /dashboard/microposts/api/:id should return 404 for non-existent', async () => {
      const customUseCases = createMockMicropostUseCases({
        delete: vi.fn().mockResolvedValue(false)
      })
      const app = createApp(createTestContainer({ micropostUseCases: customUseCases }))

      const res = await app.request('/dashboard/microposts/api/000000000000000000000000', {
        method: 'DELETE',
        headers: apiHeaders,
      })

      expect(res.status).toBe(404)
    })
  })
})
