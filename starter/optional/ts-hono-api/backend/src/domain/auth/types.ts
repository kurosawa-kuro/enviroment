/**
 * Authorization types for role-based access control
 *
 * This module defines the core types for the authorization system:
 * - Role: User permission levels (owner > admin > operator > viewer)
 * - AuthContext: Authentication context available after authentication
 * - PolicyFunction: Function signature for access control policies
 */

/**
 * Role definitions for the application
 * Hierarchy: owner > admin > operator > viewer
 */
export type Role = 'owner' | 'admin' | 'operator' | 'viewer'

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 100,
  admin: 75,
  operator: 50,
  viewer: 25,
} as const

/**
 * All valid roles as an array (for validation)
 */
export const VALID_ROLES: Role[] = ['owner', 'admin', 'operator', 'viewer']

/**
 * Authentication context available after authentication
 * Built from Clerk session data and config
 */
export interface AuthContext {
  /** Clerk user ID */
  userId: string
  /** Clerk session ID */
  sessionId: string | null
  /** Resolved user role */
  role: Role
  /** Clerk organization ID (if applicable) */
  orgId?: string | null
  /** Clerk organization role (if applicable) */
  orgRole?: string | null
}

/**
 * Policy function signature
 * Returns true if access is allowed, false otherwise
 */
export type PolicyFunction = (ctx: AuthContext) => boolean | Promise<boolean>
