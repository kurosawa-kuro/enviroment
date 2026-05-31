import { describe, it, expect } from 'vitest'
import { createInMemoryJobStore } from '../../../src/infra/services/jobStore/memory.js'

describe('createInMemoryJobStore', () => {
  it('should create job with pending status', async () => {
    const store = createInMemoryJobStore()
    const job = await store.create('test-job')

    expect(job.name).toBe('test-job')
    expect(job.status).toBe('pending')
    expect(job.progress).toBe(0)
  })

  it('should get job by id', async () => {
    const store = createInMemoryJobStore()
    const created = await store.create('test-job')
    const retrieved = await store.get(created.id)

    expect(retrieved).not.toBeNull()
    expect(retrieved!.id).toBe(created.id)
  })

  it('should list jobs', async () => {
    const store = createInMemoryJobStore()
    await store.create('job-1')
    await store.create('job-2')
    const jobs = await store.list()

    expect(jobs).toHaveLength(2)
    expect(jobs.map(j => j.name).sort()).toEqual(['job-1', 'job-2'])
  })

  it('should update job status', async () => {
    const store = createInMemoryJobStore()
    const job = await store.create('test-job')
    const updated = await store.update(job.id, { status: 'completed', progress: 100 })

    expect(updated!.status).toBe('completed')
    expect(updated!.progress).toBe(100)
  })

  it('should delete job', async () => {
    const store = createInMemoryJobStore()
    const job = await store.create('test-job')
    const deleted = await store.delete(job.id)

    expect(deleted).toBe(true)
    expect(await store.get(job.id)).toBeNull()
  })
})
