/**
 * LTS v1 Settings Adapters
 * Adapt domain entities to/from LTS v1 contract format
 */

import type { LtsSettingsDocument } from '../documents/settings.js'
import type { SettingsId } from '../types/index.js'
import { IdValidators, TimePolicy } from '../types/index.js'
import { AdaptError } from './errors.js'

/**
 * Current domain Settings type (with string updatedAt - legacy)
 * This represents the current broken state
 */
interface LegacyDomainSettings {
  id: string
  isCloud: boolean
  isStub: boolean
  aiModel: string
  updatedAt: string // ISO string - legacy format
}

/**
 * Fixed domain Settings type (with Date updatedAt)
 * This is what the domain entity SHOULD be after fix
 */
interface FixedDomainSettings {
  id: string
  isCloud: boolean
  isStub: boolean
  aiModel: string
  updatedAt: Date
}

/**
 * Adapt legacy Settings entity (string updatedAt) to LTS v1 Document
 *
 * This adapter handles the conversion from the broken string format
 * to the correct Date format required by the contract.
 *
 * @throws AdaptError if the entity doesn't conform to contract
 */
export function adaptLegacySettingsToLtsV1(entity: LegacyDomainSettings): LtsSettingsDocument {
  // Validate ID
  if (!IdValidators.isSettingsId(entity.id)) {
    throw AdaptError.invalidId('id', entity.id)
  }

  // Convert string updatedAt to Date
  const updatedAt = TimePolicy.fromISOString(entity.updatedAt)
  if (!updatedAt) {
    throw AdaptError.invalidTimestamp('updatedAt', entity.updatedAt)
  }

  // Validate boolean fields
  if (typeof entity.isCloud !== 'boolean') {
    throw AdaptError.invalidType('isCloud', 'boolean', entity.isCloud)
  }
  if (typeof entity.isStub !== 'boolean') {
    throw AdaptError.invalidType('isStub', 'boolean', entity.isStub)
  }

  // Validate aiModel
  if (typeof entity.aiModel !== 'string' || entity.aiModel.length === 0) {
    throw AdaptError.invalidType('aiModel', 'non-empty string', entity.aiModel)
  }

  return {
    id: entity.id as SettingsId,
    isCloud: entity.isCloud,
    isStub: entity.isStub,
    aiModel: entity.aiModel,
    updatedAt,
  }
}

/**
 * Adapt fixed Settings entity (Date updatedAt) to LTS v1 Document
 *
 * Use this after the domain entity is fixed to use Date.
 *
 * @throws AdaptError if the entity doesn't conform to contract
 */
export function adaptSettingsToLtsV1(entity: FixedDomainSettings): LtsSettingsDocument {
  // Validate ID
  if (!IdValidators.isSettingsId(entity.id)) {
    throw AdaptError.invalidId('id', entity.id)
  }

  // Validate timestamp
  if (!TimePolicy.isValidTimestamp(entity.updatedAt)) {
    throw AdaptError.invalidTimestamp('updatedAt', entity.updatedAt)
  }

  // Validate boolean fields
  if (typeof entity.isCloud !== 'boolean') {
    throw AdaptError.invalidType('isCloud', 'boolean', entity.isCloud)
  }
  if (typeof entity.isStub !== 'boolean') {
    throw AdaptError.invalidType('isStub', 'boolean', entity.isStub)
  }

  // Validate aiModel
  if (typeof entity.aiModel !== 'string' || entity.aiModel.length === 0) {
    throw AdaptError.invalidType('aiModel', 'non-empty string', entity.aiModel)
  }

  return {
    id: entity.id as SettingsId,
    isCloud: entity.isCloud,
    isStub: entity.isStub,
    aiModel: entity.aiModel,
    updatedAt: entity.updatedAt,
  }
}

/**
 * Adapt LTS v1 Document to domain Settings entity
 */
export function adaptLtsV1ToSettings(doc: LtsSettingsDocument): FixedDomainSettings {
  return {
    id: doc.id,
    isCloud: doc.isCloud,
    isStub: doc.isStub,
    aiModel: doc.aiModel,
    updatedAt: doc.updatedAt,
  }
}
