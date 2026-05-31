/**
 * LTS v1 ID Types
 * ID generation and validation rules for the contract layer
 */

/** Branded type for Micropost IDs (MongoDB ObjectId format) */
export type MicropostId = string & { readonly __brand: 'MicropostId' }

/** Branded type for Settings IDs (timestamp-based format) */
export type SettingsId = string & { readonly __brand: 'SettingsId' }

/** Branded type for User/Creator IDs (Clerk user ID format) */
export type UserId = string & { readonly __brand: 'UserId' }

/** ID validation utilities */
export const IdValidators = {
  isMicropostId: (value: string): value is MicropostId => {
    // MongoDB ObjectId: 24 hex characters
    return /^[a-f\d]{24}$/i.test(value)
  },

  isSettingsId: (value: string): value is SettingsId => {
    // Format: timestamp-random (e.g., "1704067200000-abc123xyz")
    return /^\d+-[a-z0-9]+$/.test(value)
  },

  isUserId: (value: string): value is UserId => {
    // Clerk user ID format: user_xxx or fallback format
    return value.startsWith('user_') || value.length > 0
  },
} as const
