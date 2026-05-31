import { describe, it, expect } from 'vitest'
import { wrapDbOperation } from '../../../src/infra/database/errors.js'
import { AppError } from '../../../src/shared/errors.js'

describe('wrapDbOperation', () => {
  it('should return result on success', async () => {
    const result = await wrapDbOperation(async () => {
      return { id: '123', name: 'test' }
    }, 'test.get')

    expect(result).toEqual({ id: '123', name: 'test' })
  })

  it('should throw AppError on failure', async () => {
    const dbError = new Error('Connection failed')

    await expect(
      wrapDbOperation(async () => {
        throw dbError
      }, 'test.get')
    ).rejects.toThrow(AppError)
  })

  it('should include context in error message', async () => {
    try {
      await wrapDbOperation(async () => {
        throw new Error('Connection failed')
      }, 'settings.save')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).message).toContain('settings.save')
      expect((err as AppError).status).toBe(503)
    }
  })
})
