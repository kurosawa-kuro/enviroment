/**
 * Auth Helpers - Declarative authentication/authorization for routes
 *
 * Usage:
 *   import { createAuthStrategy, authRequired } from './auth/index.js'
 *   import { canAccess } from '../../../domain/auth/index.js'
 *
 *   const auth = createAuthStrategy(appConfig)
 *
 *   // Apply to routes
 *   app.use('/admin/*', ...authRequired(auth, canAccess.adminPage))
 *   app.use('/public/*', ...authOptional(auth))
 */

import type { MiddlewareHandler } from 'hono'
import type { AppConfig } from '../../../env/index.js'
import type { PolicyFunction } from '../../../domain/auth/index.js'
import {
  createAuthMiddleware,
  createRequireAuthMiddleware,
  createAuthContextMiddleware,
  createAuthorizeMiddleware,
} from './clerk.js'

/**
 * Auth strategy containing all auth-related middleware factories
 */
export interface AuthStrategy {
  /** Clerk authentication middleware (validates session) */
  clerkMiddleware: MiddlewareHandler
  /** Require authentication (401/redirect if not authenticated) */
  requireAuth: MiddlewareHandler
  /** Build and store AuthContext in request context */
  authContext: MiddlewareHandler
  /** Create authorization middleware for a specific policy */
  authorize: (policy: PolicyFunction) => MiddlewareHandler
}

/**
 * Create auth strategy factory from config
 */
export function createAuthStrategy(config: AppConfig): AuthStrategy {
  return {
    clerkMiddleware: createAuthMiddleware(config),
    requireAuth: createRequireAuthMiddleware(config),
    authContext: createAuthContextMiddleware(config),
    authorize: (policy: PolicyFunction) => createAuthorizeMiddleware(config, policy),
  }
}

/**
 * Combine middleware for routes that require authentication
 *
 * Usage:
 *   app.use('/admin/*', ...authRequired(auth, canAccess.adminPage))
 *
 * Middleware chain:
 * 1. clerkMiddleware - Validate Clerk session
 * 2. authContext - Build AuthContext with role
 * 3. requireAuth - Ensure authenticated (401/redirect)
 * 4. authorize(policy) - Check policy (403 if denied) - only if policy provided
 *
 * @param auth - Auth strategy from createAuthStrategy
 * @param policy - Optional policy function to check after authentication
 */
export function authRequired(
  auth: AuthStrategy,
  policy?: PolicyFunction
): MiddlewareHandler[] {
  const middlewares: MiddlewareHandler[] = [
    auth.clerkMiddleware,
    auth.authContext,
    auth.requireAuth,
  ]

  if (policy) {
    middlewares.push(auth.authorize(policy))
  }

  return middlewares
}

/**
 * Combine middleware for routes where auth is optional
 * Sets up auth context but doesn't require authentication
 *
 * Useful for pages that show different content based on auth state
 *
 * Usage:
 *   app.use('/public/*', ...authOptional(auth))
 *
 * @param auth - Auth strategy from createAuthStrategy
 */
export function authOptional(auth: AuthStrategy): MiddlewareHandler[] {
  return [auth.clerkMiddleware, auth.authContext]
}
