/**
 * Authorization policies for role-based access control
 *
 * This module provides:
 * - Policy factory functions (hasMinRole, hasAnyRole, etc.)
 * - Policy combinators (allOf, anyOf)
 * - Pre-defined policies via canAccess namespace
 */

import type { AuthContext, PolicyFunction, Role } from './types.js'
import { ROLE_HIERARCHY } from './types.js'

/**
 * Create a policy that checks if user has minimum required role
 * Uses role hierarchy for comparison
 */
export function hasMinRole(requiredRole: Role): PolicyFunction {
  return (ctx: AuthContext) => {
    return ROLE_HIERARCHY[ctx.role] >= ROLE_HIERARCHY[requiredRole]
  }
}

/**
 * Create a policy that checks if user has any of the specified roles
 */
export function hasAnyRole(...roles: Role[]): PolicyFunction {
  return (ctx: AuthContext) => roles.includes(ctx.role)
}

/**
 * Create a policy that checks if user has all of the specified roles
 * (Note: A user typically has one role, so this is mainly for future extension)
 */
export function hasRole(role: Role): PolicyFunction {
  return (ctx: AuthContext) => ctx.role === role
}

/**
 * Combine multiple policies with AND logic
 * All policies must pass for access to be granted
 */
export function allOf(...policies: PolicyFunction[]): PolicyFunction {
  return async (ctx: AuthContext) => {
    for (const policy of policies) {
      if (!(await policy(ctx))) return false
    }
    return true
  }
}

/**
 * Combine multiple policies with OR logic
 * At least one policy must pass for access to be granted
 */
export function anyOf(...policies: PolicyFunction[]): PolicyFunction {
  return async (ctx: AuthContext) => {
    for (const policy of policies) {
      if (await policy(ctx)) return true
    }
    return false
  }
}

/**
 * Negate a policy
 */
export function not(policy: PolicyFunction): PolicyFunction {
  return async (ctx: AuthContext) => {
    return !(await policy(ctx))
  }
}

/**
 * Pre-defined access policies namespace
 *
 * Usage:
 *   import { canAccess } from './policies.js'
 *   authorize(canAccess.adminPage)
 */
export const canAccess = {
  /**
   * Admin pages - requires admin or owner role
   */
  adminPage: hasMinRole('admin'),

  /**
   * Settings read - all authenticated users can read
   */
  settingsRead: hasMinRole('viewer'),

  /**
   * Settings write - requires operator or above
   */
  settingsWrite: hasMinRole('operator'),

  /**
   * Jobs operate (create/delete) - requires operator role
   */
  jobsOperate: hasMinRole('operator'),

  /**
   * Jobs view - all authenticated users can view
   */
  jobsView: hasMinRole('viewer'),

  /**
   * Dashboard access - owner role only
   */
  dashboard: hasRole('owner'),

  /**
   * Devtool access - admin or owner only
   */
  devtool: hasMinRole('admin'),

  /**
   * System pages - owner only
   */
  system: hasAnyRole('owner'),

  /**
   * Any authenticated user
   */
  authenticated: (() => true) as PolicyFunction,
} as const
