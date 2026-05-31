import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'

// Mock render
vi.mock('../../../src/presentation/helpers/render.js', () => ({
  render: vi.fn().mockResolvedValue(new Response('<html></html>'))
}))

import {
  createSystemJobsPageController,
  createReservationController,
  getReservationStatusController,
  getAllReservationsController
} from '../../../src/presentation/controllers/system/jobs/page.js'
import { createMockJobStore } from '../../helpers/mocks.js'

describe('createSystemJobsPageController', () => {
  it('should return a controller function', () => {
    const controller = createSystemJobsPageController()

    expect(typeof controller).toBe('function')
  })
})

describe('createReservationController', () => {
  it('should create a job', async () => {
    const mockJobStore = createMockJobStore({
      create: vi.fn().mockResolvedValue({ id: 'job_1', name: 'Test Job', status: 'pending', progress: 0, createdAt: new Date(), updatedAt: new Date() })
    })

    const app = new Hono()
    app.post('/jobs', createReservationController(mockJobStore))

    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Job' })
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('Test Job')
  })
})

describe('getReservationStatusController', () => {
  it('should return job status', async () => {
    const mockJobStore = createMockJobStore({
      get: vi.fn().mockResolvedValue({ id: 'job_1', name: 'Test', status: 'processing', progress: 50, createdAt: new Date(), updatedAt: new Date() })
    })

    const app = new Hono()
    app.get('/jobs/:id', getReservationStatusController(mockJobStore))

    const res = await app.request('/jobs/job_1')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.progress).toBe(50)
  })
})

describe('getAllReservationsController', () => {
  it('should return all jobs', async () => {
    const mockJobStore = createMockJobStore({
      list: vi.fn().mockResolvedValue([
        { id: 'job_1', name: 'Job 1', status: 'completed', progress: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: 'job_2', name: 'Job 2', status: 'pending', progress: 0, createdAt: new Date(), updatedAt: new Date() }
      ])
    })

    const app = new Hono()
    app.get('/jobs', getAllReservationsController(mockJobStore))

    const res = await app.request('/jobs')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
  })
})
