/**
 * LTS v1 Time Policy
 * All time fields in Contract MUST be Date type
 * String conversion (ISO format) is Presentation layer responsibility
 */

/** Time policy for LTS v1 - all timestamps are JavaScript Date objects */
export type LtsTimestamp = Date

/** Time field names used in documents */
export type TimeFieldName = 'createdAt' | 'updatedAt' | 'archivedAt'

/** Utility functions for time handling within Contract layer */
export const TimePolicy = {
  /** Create a new timestamp (current time) */
  now: (): LtsTimestamp => new Date(),

  /** Validate that a value is a valid Date object */
  isValidTimestamp: (value: unknown): value is LtsTimestamp => {
    return value instanceof Date && !isNaN(value.getTime())
  },

  /** Parse ISO string to Date (for adapter use) */
  fromISOString: (isoString: string): LtsTimestamp | null => {
    const date = new Date(isoString)
    return isNaN(date.getTime()) ? null : date
  },
} as const
