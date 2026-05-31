/**
 * LTS v1 Adaptation Errors
 * Error types for contract validation and adaptation failures
 */

/** Error codes for adaptation failures */
export type AdaptErrorCode =
  | 'INVALID_ID'
  | 'INVALID_TIMESTAMP'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_TYPE'
  | 'INVALID_STATUS'
  | 'VALIDATION_FAILED'

/** Detailed information about adaptation failure */
export interface AdaptErrorDetails {
  readonly field?: string
  readonly expectedType?: string
  readonly actualValue?: unknown
  readonly message?: string
}

/**
 * AdaptError - thrown when data cannot be adapted to LTS v1 contract
 *
 * This error indicates that incoming data does not conform to the
 * LTS v1 contract specification and cannot be safely used.
 */
export class AdaptError extends Error {
  readonly code: AdaptErrorCode
  readonly details: AdaptErrorDetails

  constructor(code: AdaptErrorCode, message: string, details: AdaptErrorDetails = {}) {
    super(message)
    this.name = 'AdaptError'
    this.code = code
    this.details = details
  }

  /** Create error for invalid ID format */
  static invalidId(field: string, value: unknown): AdaptError {
    return new AdaptError('INVALID_ID', `Invalid ID format for field '${field}'`, {
      field,
      actualValue: value,
    })
  }

  /** Create error for invalid timestamp */
  static invalidTimestamp(field: string, value: unknown): AdaptError {
    return new AdaptError('INVALID_TIMESTAMP', `Invalid timestamp for field '${field}'`, {
      field,
      expectedType: 'Date',
      actualValue: value,
    })
  }

  /** Create error for missing required field */
  static missingField(field: string): AdaptError {
    return new AdaptError('MISSING_REQUIRED_FIELD', `Missing required field '${field}'`, { field })
  }

  /** Create error for invalid field type */
  static invalidType(field: string, expectedType: string, actualValue: unknown): AdaptError {
    return new AdaptError('INVALID_FIELD_TYPE', `Field '${field}' expected ${expectedType}`, {
      field,
      expectedType,
      actualValue,
    })
  }

  /** Create error for invalid status value */
  static invalidStatus(value: unknown): AdaptError {
    return new AdaptError('INVALID_STATUS', `Invalid status value: ${String(value)}`, {
      field: 'status',
      actualValue: value,
    })
  }
}
