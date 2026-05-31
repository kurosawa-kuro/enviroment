import { describe, it, expect } from 'vitest'
import { notFoundPage, forbiddenPage } from '../../../src/presentation/helpers/pageController.js'
import { AppError } from '../../../src/shared/errors.js'

describe('notFoundPage', () => {
  it('should throw 404 error', () => {
    expect(() => notFoundPage('Resource')).toThrow(AppError)

    try {
      notFoundPage('Resource')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).message).toBe('Resource not found')
    }
  })
})

describe('forbiddenPage', () => {
  it('should throw 403 error', () => {
    expect(() => forbiddenPage('Access denied')).toThrow(AppError)

    try {
      forbiddenPage('Access denied')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).status).toBe(403)
    }
  })
})
