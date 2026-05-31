/**
 * LTS v1 Common Types
 * Shared types across all contract documents
 */

import type { LtsTimestamp } from './time.js'

/** Base fields present in all LTS documents */
export interface LtsDocumentBase {
  readonly id: string
  readonly createdAt: LtsTimestamp
  readonly updatedAt: LtsTimestamp
}

/** Micropost status values (frozen for v1) */
export type LtsMicropostStatus = 'draft' | 'published'

/** Read-only marker for immutable contract types */
export type Immutable<T> = {
  readonly [K in keyof T]: T[K]
}
