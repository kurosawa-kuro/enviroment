import { describe, it, expect } from 'vitest'
import { settingsSchema } from '../../../src/presentation/schemas/settings.js'

describe('settingsSchema', () => {
  it('should validate valid settings', () => {
    const result = settingsSchema.safeParse({
      isCloud: true,
      isStub: false,
      aiModel: 'gpt-4'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        isCloud: true,
        isStub: false,
        aiModel: 'gpt-4'
      })
    }
  })

  it('should trim aiModel whitespace', () => {
    const result = settingsSchema.safeParse({
      isCloud: true,
      isStub: false,
      aiModel: '  gpt-4  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.aiModel).toBe('gpt-4')
    }
  })

  it('should reject empty aiModel', () => {
    const result = settingsSchema.safeParse({
      isCloud: true,
      isStub: false,
      aiModel: '   '
    })

    expect(result.success).toBe(false)
  })
})
