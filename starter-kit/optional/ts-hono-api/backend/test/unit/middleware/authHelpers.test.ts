import { describe, it, expect, vi } from 'vitest'
import { createAuthStrategy, authRequired, authOptional } from '../../../src/presentation/middleware/auth/helpers.js'
import type { AppConfig } from '../../../src/env/index.js'

// Mock clerk.ts
vi.mock('../../../src/presentation/middleware/auth/clerk.js', () => ({
  createAuthMiddleware: vi.fn(() => vi.fn()),
  createRequireAuthMiddleware: vi.fn(() => vi.fn()),
  createAuthContextMiddleware: vi.fn(() => vi.fn()),
  createAuthorizeMiddleware: vi.fn(() => vi.fn())
}))

describe('createAuthStrategy', () => {
  it('should create auth strategy with all middleware', () => {
    const config = { authEnabled: true } as AppConfig
    const strategy = createAuthStrategy(config)

    expect(strategy.clerkMiddleware).toBeDefined()
    expect(strategy.requireAuth).toBeDefined()
    expect(strategy.authContext).toBeDefined()
    expect(strategy.authorize).toBeDefined()
  })
})

describe('authRequired', () => {
  it('should return middleware chain without policy', () => {
    const config = { authEnabled: true } as AppConfig
    const auth = createAuthStrategy(config)
    const middlewares = authRequired(auth)

    expect(middlewares).toHaveLength(3)
  })

  it('should return middleware chain with policy', () => {
    const config = { authEnabled: true } as AppConfig
    const auth = createAuthStrategy(config)
    const policy = vi.fn()
    const middlewares = authRequired(auth, policy)

    expect(middlewares).toHaveLength(4)
  })
})

describe('authOptional', () => {
  it('should return middleware chain for optional auth', () => {
    const config = { authEnabled: true } as AppConfig
    const auth = createAuthStrategy(config)
    const middlewares = authOptional(auth)

    expect(middlewares).toHaveLength(2)
  })
})
