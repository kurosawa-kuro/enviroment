/**
 * LTS v1 Micropost Adapters
 * Adapt domain entities to/from LTS v1 contract format
 */

import type { LtsMicropostDocument } from '../documents/micropost.js'
import type { MicropostId, UserId } from '../types/index.js'
import { IdValidators, TimePolicy } from '../types/index.js'
import { AdaptError } from './errors.js'

/**
 * Domain Micropost type (from domain/entities/micropost.ts)
 * This is the current domain entity format
 */
interface DomainMicropost {
  id: string
  title: string
  body: string
  creatorId: string
  imagePath?: string
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}

/**
 * Adapt a domain Micropost entity to LTS v1 Document format
 *
 * @throws AdaptError if the entity doesn't conform to contract
 */
export function adaptMicropostToLtsV1(entity: DomainMicropost): LtsMicropostDocument {
  // Validate ID
  if (!IdValidators.isMicropostId(entity.id)) {
    throw AdaptError.invalidId('id', entity.id)
  }

  // Validate creatorId
  if (!IdValidators.isUserId(entity.creatorId)) {
    throw AdaptError.invalidId('creatorId', entity.creatorId)
  }

  // Validate timestamps
  if (!TimePolicy.isValidTimestamp(entity.createdAt)) {
    throw AdaptError.invalidTimestamp('createdAt', entity.createdAt)
  }
  if (!TimePolicy.isValidTimestamp(entity.updatedAt)) {
    throw AdaptError.invalidTimestamp('updatedAt', entity.updatedAt)
  }

  // Validate status
  if (entity.status !== 'draft' && entity.status !== 'published') {
    throw AdaptError.invalidStatus(entity.status)
  }

  // Validate required string fields
  if (typeof entity.title !== 'string') {
    throw AdaptError.invalidType('title', 'string', entity.title)
  }
  if (typeof entity.body !== 'string') {
    throw AdaptError.invalidType('body', 'string', entity.body)
  }

  return {
    id: entity.id as MicropostId,
    title: entity.title,
    body: entity.body,
    creatorId: entity.creatorId as UserId,
    imagePath: entity.imagePath,
    status: entity.status,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

/**
 * Adapt LTS v1 Document to domain Micropost entity
 * Used when reading from external sources that provide LTS format
 */
export function adaptLtsV1ToMicropost(doc: LtsMicropostDocument): DomainMicropost {
  return {
    id: doc.id,
    title: doc.title,
    body: doc.body,
    creatorId: doc.creatorId,
    imagePath: doc.imagePath,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/**
 * Batch adapt multiple microposts
 * Returns successful adaptations and collects errors
 */
export function adaptMicropostsToLtsV1(entities: DomainMicropost[]): {
  documents: LtsMicropostDocument[]
  errors: Array<{ index: number; error: AdaptError }>
} {
  const documents: LtsMicropostDocument[] = []
  const errors: Array<{ index: number; error: AdaptError }> = []

  entities.forEach((entity, index) => {
    try {
      documents.push(adaptMicropostToLtsV1(entity))
    } catch (e) {
      if (e instanceof AdaptError) {
        errors.push({ index, error: e })
      } else {
        throw e
      }
    }
  })

  return { documents, errors }
}
