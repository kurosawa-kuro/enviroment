/**
 * LTS v1 Micropost Document
 * Frozen contract definition - any changes require v2
 */

import type { LtsTimestamp, LtsMicropostStatus, MicropostId, UserId } from '../types/index.js'

/**
 * LTS v1 Micropost Document
 *
 * Contract guarantees:
 * - id: MongoDB ObjectId format (24 hex chars)
 * - title: non-empty string
 * - body: string (can be empty)
 * - creatorId: Clerk user ID format
 * - imagePath: optional Cloudinary URL
 * - status: 'draft' | 'published'
 * - createdAt: Date object
 * - updatedAt: Date object
 */
export interface LtsMicropostDocument {
  readonly id: MicropostId
  readonly title: string
  readonly body: string
  readonly creatorId: UserId
  readonly imagePath?: string
  readonly status: LtsMicropostStatus
  readonly createdAt: LtsTimestamp
  readonly updatedAt: LtsTimestamp
}

/**
 * Input type for creating a new Micropost
 * Used by adapters to validate incoming data
 */
export interface LtsMicropostCreateInput {
  readonly title: string
  readonly body: string
  readonly creatorId: UserId
  readonly imagePath?: string
  readonly status: LtsMicropostStatus
}

/**
 * Input type for updating an existing Micropost
 */
export interface LtsMicropostUpdateInput {
  readonly title?: string
  readonly body?: string
  readonly imagePath?: string
  readonly status?: LtsMicropostStatus
}
