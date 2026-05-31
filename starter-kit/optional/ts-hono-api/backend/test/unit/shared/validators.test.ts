import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validateBody } from '../../../src/shared/validators.js'

describe('validateBody', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().min(0, 'Age must be positive')
  })

  it('should return success with valid data', () => {
    const result = validateBody(testSchema, { name: 'John', age: 30 })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'John', age: 30 })
    }
  })

  it('should return error with invalid data', () => {
    const result = validateBody(testSchema, { name: '', age: 30 })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Name is required')
    }
  })
})
