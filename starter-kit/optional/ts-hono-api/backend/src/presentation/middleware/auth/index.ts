/**
 * Auth Middleware - Public API
 *
 * Usage:
 *   import { createAuthStrategy, authRequired, authOptional } from './middleware/auth/index.js'
 *   import { getCurrentAuth, getCurrentUserId } from './middleware/auth/index.js'
 */

// Re-export from clerk.ts (core auth middleware)
export {
  createAuthMiddleware,
  createRequireAuthMiddleware,
  createAuthContextMiddleware,
  createAuthorizeMiddleware,
  getCurrentAuth,
  getCurrentUserId,
  getAuthContext,
} from './clerk.js'

// Re-export from helpers.ts (declarative auth helpers)
export {
  createAuthStrategy,
  authRequired,
  authOptional,
} from './helpers.js'

// Re-export types
export type { AuthStrategy } from './helpers.js'
