import { describe, it, expect } from 'vitest'
import { createMicropostSchema } from '../../../src/presentation/schemas/micropost.js'

describe('createMicropostSchema', () => {
  it('should validate valid micropost', () => {
    const result = createMicropostSchema.safeParse({
      title: 'Test Title',
      body: 'Test body content',
      status: 'published'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Test Title')
      expect(result.data.body).toBe('Test body content')
      expect(result.data.status).toBe('published')
    }
  })

  it('should default status to draft', () => {
    const result = createMicropostSchema.safeParse({
      title: 'Test Title',
      body: 'Test body'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('draft')
    }
  })

  it('should trim title and body', () => {
    const result = createMicropostSchema.safeParse({
      title: '  Test Title  ',
      body: '  Test body  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Test Title')
      expect(result.data.body).toBe('Test body')
    }
  })

  it('should reject empty title', () => {
    const result = createMicropostSchema.safeParse({
      title: '',
      body: 'Test body'
    })

    expect(result.success).toBe(false)
  })

  it('should reject empty body', () => {
    const result = createMicropostSchema.safeParse({
      title: 'Test',
      body: ''
    })

    expect(result.success).toBe(false)
  })
})
