import { describe, it, expect } from 'vitest'
import {
  canAccess,
  hasMinRole,
  hasAnyRole,
  hasRole,
  allOf,
  anyOf,
  not,
} from '../../../src/domain/auth/policies.js'
import type { AuthContext, Role } from '../../../src/domain/auth/types.js'

/**
 * Helper function to create AuthContext for testing
 */
function createAuthContext(role: Role): AuthContext {
  return {
    userId: 'user_123',
    sessionId: 'sess_123',
    role,
  }
}

describe('Policy Functions', () => {
  describe('hasMinRole', () => {
    it('should allow owner for any role requirement', () => {
      const ctx = createAuthContext('owner')
      expect(hasMinRole('owner')(ctx)).toBe(true)
      expect(hasMinRole('admin')(ctx)).toBe(true)
      expect(hasMinRole('operator')(ctx)).toBe(true)
      expect(hasMinRole('viewer')(ctx)).toBe(true)
    })

    it('should allow admin for admin and below', () => {
      const ctx = createAuthContext('admin')
      expect(hasMinRole('owner')(ctx)).toBe(false)
      expect(hasMinRole('admin')(ctx)).toBe(true)
      expect(hasMinRole('operator')(ctx)).toBe(true)
      expect(hasMinRole('viewer')(ctx)).toBe(true)
    })

    it('should allow operator for operator and below', () => {
      const ctx = createAuthContext('operator')
      expect(hasMinRole('owner')(ctx)).toBe(false)
      expect(hasMinRole('admin')(ctx)).toBe(false)
      expect(hasMinRole('operator')(ctx)).toBe(true)
      expect(hasMinRole('viewer')(ctx)).toBe(true)
    })

    it('should only allow viewer for viewer role', () => {
      const ctx = createAuthContext('viewer')
      expect(hasMinRole('owner')(ctx)).toBe(false)
      expect(hasMinRole('admin')(ctx)).toBe(false)
      expect(hasMinRole('operator')(ctx)).toBe(false)
      expect(hasMinRole('viewer')(ctx)).toBe(true)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true if user has any of the specified roles', () => {
      const ctx = createAuthContext('admin')
      expect(hasAnyRole('owner', 'admin')(ctx)).toBe(true)
      expect(hasAnyRole('admin', 'operator')(ctx)).toBe(true)
      expect(hasAnyRole('admin')(ctx)).toBe(true)
    })

    it('should return false if user has none of the specified roles', () => {
      const ctx = createAuthContext('viewer')
      expect(hasAnyRole('owner', 'admin')(ctx)).toBe(false)
      expect(hasAnyRole('operator')(ctx)).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('should return true only for exact role match', () => {
      const ctx = createAuthContext('admin')
      expect(hasRole('admin')(ctx)).toBe(true)
      expect(hasRole('owner')(ctx)).toBe(false)
      expect(hasRole('operator')(ctx)).toBe(false)
    })
  })

  describe('allOf', () => {
    it('should return true only if all policies pass', async () => {
      const ownerCtx = createAuthContext('owner')
      const viewerCtx = createAuthContext('viewer')

      const policy = allOf(hasMinRole('admin'), hasMinRole('operator'))

      expect(await policy(ownerCtx)).toBe(true)
      expect(await policy(viewerCtx)).toBe(false)
    })

    it('should short-circuit on first failure', async () => {
      const ctx = createAuthContext('viewer')
      let secondCalled = false

      const policy = allOf(
        hasMinRole('admin'),
        () => {
          secondCalled = true
          return true
        }
      )

      expect(await policy(ctx)).toBe(false)
      expect(secondCalled).toBe(false)
    })
  })

  describe('anyOf', () => {
    it('should return true if any policy passes', async () => {
      const adminCtx = createAuthContext('admin')
      const viewerCtx = createAuthContext('viewer')

      const policy = anyOf(hasRole('owner'), hasRole('admin'))

      expect(await policy(adminCtx)).toBe(true)
      expect(await policy(viewerCtx)).toBe(false)
    })

    it('should short-circuit on first success', async () => {
      const ctx = createAuthContext('owner')
      let secondCalled = false

      const policy = anyOf(
        hasRole('owner'),
        () => {
          secondCalled = true
          return true
        }
      )

      expect(await policy(ctx)).toBe(true)
      expect(secondCalled).toBe(false)
    })
  })

  describe('not', () => {
    it('should negate a policy', async () => {
      const ownerCtx = createAuthContext('owner')
      const viewerCtx = createAuthContext('viewer')

      const notOwner = not(hasRole('owner'))

      expect(await notOwner(ownerCtx)).toBe(false)
      expect(await notOwner(viewerCtx)).toBe(true)
    })
  })
})

describe('canAccess Policies', () => {
  describe('canAccess.dashboard', () => {
    it('should allow owner role', () => {
      const ctx = createAuthContext('owner')
      expect(canAccess.dashboard(ctx)).toBe(true)
    })

    it('should deny non-owner roles', () => {
      expect(canAccess.dashboard(createAuthContext('admin'))).toBe(false)
      expect(canAccess.dashboard(createAuthContext('operator'))).toBe(false)
      expect(canAccess.dashboard(createAuthContext('viewer'))).toBe(false)
    })
  })

  describe('canAccess.adminPage', () => {
    it('should allow owner', () => {
      const ctx = createAuthContext('owner')
      expect(canAccess.adminPage(ctx)).toBe(true)
    })

    it('should allow admin', () => {
      const ctx = createAuthContext('admin')
      expect(canAccess.adminPage(ctx)).toBe(true)
    })

    it('should deny operator', () => {
      const ctx = createAuthContext('operator')
      expect(canAccess.adminPage(ctx)).toBe(false)
    })

    it('should deny viewer', () => {
      const ctx = createAuthContext('viewer')
      expect(canAccess.adminPage(ctx)).toBe(false)
    })
  })

  describe('canAccess.settingsRead', () => {
    it('should allow all roles', () => {
      expect(canAccess.settingsRead(createAuthContext('owner'))).toBe(true)
      expect(canAccess.settingsRead(createAuthContext('admin'))).toBe(true)
      expect(canAccess.settingsRead(createAuthContext('operator'))).toBe(true)
      expect(canAccess.settingsRead(createAuthContext('viewer'))).toBe(true)
    })
  })

  describe('canAccess.settingsWrite', () => {
    it('should allow owner and admin and operator', () => {
      expect(canAccess.settingsWrite(createAuthContext('owner'))).toBe(true)
      expect(canAccess.settingsWrite(createAuthContext('admin'))).toBe(true)
      expect(canAccess.settingsWrite(createAuthContext('operator'))).toBe(true)
    })

    it('should deny viewer', () => {
      expect(canAccess.settingsWrite(createAuthContext('viewer'))).toBe(false)
    })
  })

  describe('canAccess.system', () => {
    it('should allow only owner', () => {
      expect(canAccess.system(createAuthContext('owner'))).toBe(true)
      expect(canAccess.system(createAuthContext('admin'))).toBe(false)
      expect(canAccess.system(createAuthContext('operator'))).toBe(false)
      expect(canAccess.system(createAuthContext('viewer'))).toBe(false)
    })
  })

  describe('canAccess.devtool', () => {
    it('should allow owner and admin', () => {
      expect(canAccess.devtool(createAuthContext('owner'))).toBe(true)
      expect(canAccess.devtool(createAuthContext('admin'))).toBe(true)
    })

    it('should deny operator and viewer', () => {
      expect(canAccess.devtool(createAuthContext('operator'))).toBe(false)
      expect(canAccess.devtool(createAuthContext('viewer'))).toBe(false)
    })
  })

  describe('canAccess.authenticated', () => {
    it('should allow any authenticated user', () => {
      expect(canAccess.authenticated(createAuthContext('owner'))).toBe(true)
      expect(canAccess.authenticated(createAuthContext('admin'))).toBe(true)
      expect(canAccess.authenticated(createAuthContext('operator'))).toBe(true)
      expect(canAccess.authenticated(createAuthContext('viewer'))).toBe(true)
    })
  })
})
