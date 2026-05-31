import { describe, it, expect } from 'vitest'
import { resolveRole, buildAuthContext } from '../../../src/domain/auth/roleResolver.js'

describe('Role Resolver', () => {
  describe('resolveRole', () => {
    it('should use Clerk metadata role when available and valid', () => {
      const claims = { publicMetadata: { role: 'admin' } }
      expect(resolveRole('user_123', claims, [])).toBe('admin')
    })

    it('should handle all valid roles from Clerk metadata', () => {
      expect(resolveRole('user_123', { publicMetadata: { role: 'owner' } }, [])).toBe('owner')
      expect(resolveRole('user_123', { publicMetadata: { role: 'admin' } }, [])).toBe('admin')
      expect(resolveRole('user_123', { publicMetadata: { role: 'operator' } }, [])).toBe('operator')
      expect(resolveRole('user_123', { publicMetadata: { role: 'viewer' } }, [])).toBe('viewer')
    })

    it('should be case-insensitive for role names', () => {
      expect(resolveRole('user_123', { publicMetadata: { role: 'ADMIN' } }, [])).toBe('admin')
      expect(resolveRole('user_123', { publicMetadata: { role: 'Admin' } }, [])).toBe('admin')
      expect(resolveRole('user_123', { publicMetadata: { role: 'OWNER' } }, [])).toBe('owner')
    })

    it('should trim whitespace from role names', () => {
      expect(resolveRole('user_123', { publicMetadata: { role: '  admin  ' } }, [])).toBe('admin')
    })

    it('should fallback to owner for ownerAdminUserIds', () => {
      expect(resolveRole('user_123', null, ['user_123'])).toBe('owner')
      expect(resolveRole('user_123', undefined, ['user_123'])).toBe('owner')
      expect(resolveRole('user_123', {}, ['user_123'])).toBe('owner')
    })

    it('should prioritize Clerk metadata over ownerAdminUserIds', () => {
      // Even if user is in ownerAdminUserIds, Clerk metadata takes precedence
      const claims = { publicMetadata: { role: 'admin' } }
      expect(resolveRole('user_123', claims, ['user_123'])).toBe('admin')
    })

    it('should default to viewer when no metadata and not in ownerAdminUserIds', () => {
      expect(resolveRole('user_123', null, [])).toBe('viewer')
      expect(resolveRole('user_123', null, ['other_user'])).toBe('viewer')
      expect(resolveRole('user_123', {}, [])).toBe('viewer')
      expect(resolveRole('user_123', { publicMetadata: {} }, [])).toBe('viewer')
    })

    it('should ignore invalid role in metadata and use fallback', () => {
      // Invalid role should fallback to ownerAdminUserIds or viewer
      expect(resolveRole('user_123', { publicMetadata: { role: 'superuser' } }, [])).toBe('viewer')
      expect(resolveRole('user_123', { publicMetadata: { role: 'superuser' } }, ['user_123'])).toBe('owner')
      expect(resolveRole('user_123', { publicMetadata: { role: '' } }, [])).toBe('viewer')
    })

    it('should handle null/undefined publicMetadata', () => {
      expect(resolveRole('user_123', { publicMetadata: null as any }, [])).toBe('viewer')
      expect(resolveRole('user_123', { publicMetadata: undefined }, [])).toBe('viewer')
    })
  })

  describe('buildAuthContext', () => {
    it('should build AuthContext with all fields', () => {
      const claims = { publicMetadata: { role: 'admin' } }
      const ctx = buildAuthContext(
        'user_123',
        'sess_456',
        claims,
        ['user_999'],
        'org_789',
        'org_admin'
      )

      expect(ctx).toEqual({
        userId: 'user_123',
        sessionId: 'sess_456',
        role: 'admin',
        orgId: 'org_789',
        orgRole: 'org_admin',
      })
    })

    it('should resolve role to owner when user is in ownerAdminUserIds', () => {
      const ctx = buildAuthContext(
        'user_123',
        'sess_456',
        null,
        ['user_123', 'user_456'],
        null,
        null
      )

      expect(ctx.role).toBe('owner') // Because user is in ownerAdminUserIds
    })

    it('should handle null sessionId', () => {
      const ctx = buildAuthContext('user_123', null, null, [], null, null)
      expect(ctx.sessionId).toBeNull()
    })

    it('should handle missing orgId and orgRole', () => {
      const ctx = buildAuthContext('user_123', 'sess_456', null, [])
      expect(ctx.orgId).toBeUndefined()
      expect(ctx.orgRole).toBeUndefined()
    })

    it('should resolve role correctly with Clerk metadata', () => {
      const claims = { publicMetadata: { role: 'operator' } }
      const ctx = buildAuthContext('user_123', null, claims, [])
      expect(ctx.role).toBe('operator')
    })

    it('should prioritize Clerk metadata role over ownerAdminUserIds', () => {
      // User is in ownerAdminUserIds but has explicit admin role from Clerk
      const claims = { publicMetadata: { role: 'admin' } }
      const ctx = buildAuthContext('user_123', null, claims, ['user_123'])

      expect(ctx.role).toBe('admin') // Clerk metadata takes precedence
    })
  })
})
