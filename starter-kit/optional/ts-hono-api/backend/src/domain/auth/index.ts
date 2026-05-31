/**
 * Domain Auth module - Role-based access control
 *
 * Usage:
 *   import { canAccess, hasMinRole, AuthContext, Role } from '../domain/auth/index.js'
 *
 *   // Use pre-defined policies
 *   authorize(canAccess.adminPage)
 *
 *   // Create custom policies
 *   authorize(hasMinRole('operator'))
 */

// Types
export type { Role, AuthContext, PolicyFunction } from './types.js'
export { ROLE_HIERARCHY, VALID_ROLES } from './types.js'

// Policies
export {
  hasMinRole,
  hasAnyRole,
  hasRole,
  allOf,
  anyOf,
  not,
  canAccess,
} from './policies.js'

// Role resolver
export { resolveRole, buildAuthContext } from './roleResolver.js'
