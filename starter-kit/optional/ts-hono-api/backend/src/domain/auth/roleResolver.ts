/**
 * Role resolver for determining user roles from Clerk session data
 *
 * Priority:
 * 1. Clerk sessionClaims.publicMetadata.role
 * 2. ownerAdminUserIds fallback (treated as 'owner' role)
 * 3. Default to 'viewer'
 */

import type { Role, AuthContext } from './types.js'
import { VALID_ROLES } from './types.js'

/**
 * Clerk session claims structure (from publicMetadata)
 */
interface ClerkSessionClaims {
  publicMetadata?: {
    role?: string
  }
}

/**
 * Validates and normalizes role from string
 * Returns null if invalid
 */
function parseRole(roleStr: string | undefined | null): Role | null {
  if (!roleStr) return null
  const normalized = roleStr.toLowerCase().trim()
  if (VALID_ROLES.includes(normalized as Role)) {
    return normalized as Role
  }
  return null
}

/**
 * Resolve user role from Clerk metadata with fallback logic
 *
 * Priority:
 * 1. Clerk sessionClaims.publicMetadata.role (if valid)
 * 2. ownerAdminUserIds fallback (treated as 'owner' role)
 * 3. Default to 'viewer'
 */
export function resolveRole(
  userId: string,
  sessionClaims: ClerkSessionClaims | null | undefined,
  ownerAdminUserIds: string[]
): Role {
  // 1. Check Clerk metadata first
  const clerkRole = parseRole(sessionClaims?.publicMetadata?.role)
  if (clerkRole) {
    return clerkRole
  }

  // 2. Fallback to ownerAdminUserIds
  if (ownerAdminUserIds.includes(userId)) {
    return 'owner'
  }

  // 3. Default role
  return 'viewer'
}

/**
 * Build AuthContext from Clerk auth data
 *
 * @param userId - Clerk user ID
 * @param sessionId - Clerk session ID
 * @param sessionClaims - Clerk session claims (contains publicMetadata)
 * @param ownerAdminUserIds - Array of owner admin user IDs from config
 * @param orgId - Clerk organization ID (optional)
 * @param orgRole - Clerk organization role (optional)
 */
export function buildAuthContext(
  userId: string,
  sessionId: string | null,
  sessionClaims: ClerkSessionClaims | null | undefined,
  ownerAdminUserIds: string[],
  orgId?: string | null,
  orgRole?: string | null
): AuthContext {
  const role = resolveRole(userId, sessionClaims, ownerAdminUserIds)

  return {
    userId,
    sessionId,
    role,
    orgId,
    orgRole,
  }
}
