/**
 * LTS v1 Settings Document
 * Frozen contract definition - any changes require v2
 */

import type { LtsTimestamp, SettingsId } from '../types/index.js'

/**
 * LTS v1 Settings Document
 *
 * Contract guarantees:
 * - id: timestamp-random format
 * - isCloud: boolean
 * - isStub: boolean
 * - aiModel: non-empty string
 * - updatedAt: Date object (NOT string - fixed from original entity)
 */
export interface LtsSettingsDocument {
  readonly id: SettingsId
  readonly isCloud: boolean
  readonly isStub: boolean
  readonly aiModel: string
  readonly updatedAt: LtsTimestamp
}

/**
 * Input type for saving Settings
 * Used by adapters to validate incoming data
 */
export interface LtsSettingsInput {
  readonly isCloud: boolean
  readonly isStub: boolean
  readonly aiModel: string
}
