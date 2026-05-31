/**
 * Auth Audit Logger
 *
 * Provides structured logging for authentication and authorization events.
 * Uses the existing pino logger for output.
 *
 * Usage:
 *   import { authAudit } from './authAuditLogger.js'
 *
 *   authAudit.accessGranted(authContext, '/admin', 'GET')
 *   authAudit.accessDenied('user_123', '/admin', 'GET', 'Insufficient role')
 */

import { logger } from './logger.js'
import type { AuthContext } from '../domain/auth/index.js'

/**
 * Auth event types for audit logging
 */
export type AuthEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.session_created'
  | 'auth.access_denied'
  | 'auth.access_granted'
  | 'auth.unauthorized'

/**
 * Auth audit log entry structure
 */
export interface AuthAuditEntry {
  event: AuthEventType
  userId: string | null
  path: string
  method: string
  result: 'success' | 'denied' | 'error'
  role?: string
  reason?: string
  requestId?: string
  timestamp: string
}

/**
 * Log authentication/authorization events with structured format
 */
export function logAuthEvent(entry: Omit<AuthAuditEntry, 'timestamp'>): void {
  const fullEntry: AuthAuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  // Use appropriate log level based on result
  if (entry.result === 'denied') {
    logger.warn(fullEntry, `Auth event: ${entry.event}`)
  } else if (entry.result === 'error') {
    logger.error(fullEntry, `Auth event: ${entry.event}`)
  } else {
    logger.info(fullEntry, `Auth event: ${entry.event}`)
  }
}

/**
 * Convenience helpers for common auth events
 */
export const authAudit = {
  /**
   * Log successful access grant
   */
  accessGranted(
    authContext: AuthContext,
    path: string,
    method: string,
    requestId?: string
  ) {
    logAuthEvent({
      event: 'auth.access_granted',
      userId: authContext.userId,
      path,
      method,
      result: 'success',
      role: authContext.role,
      requestId,
    })
  },

  /**
   * Log access denied (authenticated but not authorized)
   */
  accessDenied(
    userId: string | null,
    path: string,
    method: string,
    reason: string,
    role?: string,
    requestId?: string
  ) {
    logAuthEvent({
      event: 'auth.access_denied',
      userId,
      path,
      method,
      result: 'denied',
      role,
      reason,
      requestId,
    })
  },

  /**
   * Log unauthorized access attempt (not authenticated)
   */
  unauthorized(path: string, method: string, requestId?: string) {
    logAuthEvent({
      event: 'auth.unauthorized',
      userId: null,
      path,
      method,
      result: 'denied',
      reason: 'No authentication provided',
      requestId,
    })
  },

  /**
   * Log successful login
   */
  login(userId: string, path: string, method: string, requestId?: string) {
    logAuthEvent({
      event: 'auth.login',
      userId,
      path,
      method,
      result: 'success',
      requestId,
    })
  },

  /**
   * Log logout
   */
  logout(userId: string, path: string, method: string, requestId?: string) {
    logAuthEvent({
      event: 'auth.logout',
      userId,
      path,
      method,
      result: 'success',
      requestId,
    })
  },

  /**
   * Log session creation
   */
  sessionCreated(
    userId: string,
    path: string,
    method: string,
    requestId?: string
  ) {
    logAuthEvent({
      event: 'auth.session_created',
      userId,
      path,
      method,
      result: 'success',
      requestId,
    })
  },
}
