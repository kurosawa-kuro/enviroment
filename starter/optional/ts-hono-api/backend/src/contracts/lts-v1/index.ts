/**
 * LTS v1 Contract
 *
 * This is the public API for the LTS v1 contract layer.
 * Once published, this contract is FROZEN and any changes require v2.
 *
 * @module contracts/lts-v1
 */

// Document types
export type {
  LtsMicropostDocument,
  LtsMicropostCreateInput,
  LtsMicropostUpdateInput,
  LtsSettingsDocument,
  LtsSettingsInput,
} from './documents/index.js'

// Core types
export type {
  MicropostId,
  SettingsId,
  UserId,
  LtsTimestamp,
  TimeFieldName,
  LtsDocumentBase,
  LtsMicropostStatus,
  Immutable,
} from './types/index.js'

// Type utilities
export { IdValidators, TimePolicy } from './types/index.js'

// Adapters
export {
  AdaptError,
  adaptMicropostToLtsV1,
  adaptLtsV1ToMicropost,
  adaptMicropostsToLtsV1,
  adaptLegacySettingsToLtsV1,
  adaptSettingsToLtsV1,
  adaptLtsV1ToSettings,
} from './adapters/index.js'

export type { AdaptErrorCode, AdaptErrorDetails } from './adapters/index.js'
