import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger before importing authAuditLogger
vi.mock('../../../src/shared/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

import { logAuthEvent, authAudit } from '../../../src/shared/authAuditLogger.js'
import { logger } from '../../../src/shared/logger.js'
import type { AuthContext } from '../../../src/domain/auth/index.js'

describe('logAuthEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log success events with info level', () => {
    logAuthEvent({
      event: 'auth.login',
      userId: 'user_123',
      path: '/login',
      method: 'POST',
      result: 'success'
    })

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.login',
        userId: 'user_123',
        result: 'success'
      }),
      'Auth event: auth.login'
    )
  })

  it('should log denied events with warn level', () => {
    logAuthEvent({
      event: 'auth.access_denied',
      userId: 'user_123',
      path: '/admin',
      method: 'GET',
      result: 'denied'
    })

    expect(logger.warn).toHaveBeenCalled()
  })
})

describe('authAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log accessGranted event', () => {
    const authContext: AuthContext = {
      userId: 'user_123',
      role: 'admin',
      isAuthenticated: true
    }

    authAudit.accessGranted(authContext, '/admin', 'GET', 'req_123')

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.access_granted',
        userId: 'user_123',
        role: 'admin'
      }),
      expect.any(String)
    )
  })

  it('should log accessDenied event', () => {
    authAudit.accessDenied('user_123', '/admin', 'GET', 'Insufficient role', 'user')

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.access_denied',
        reason: 'Insufficient role'
      }),
      expect.any(String)
    )
  })

  it('should log unauthorized event', () => {
    authAudit.unauthorized('/admin', 'GET')

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.unauthorized',
        userId: null
      }),
      expect.any(String)
    )
  })

  it('should log login event', () => {
    authAudit.login('user_123', '/login', 'POST')

    expect(logger.info).toHaveBeenCalled()
  })

  it('should log logout event', () => {
    authAudit.logout('user_123', '/logout', 'POST')

    expect(logger.info).toHaveBeenCalled()
  })
})
