# LTS Contract v1

## Overview

This directory contains the Long-Term Support (LTS) Contract definitions for v1 of the API.
Once published, this contract is **FROZEN** - any changes require creating v2.

## Contract Rules

### What is Included

- **Document type definitions** (`documents/`) - Shape of data exchanged
- **TimePolicy** (`types/time.ts`) - Time handling policies
- **ID generation rules** (`types/ids.ts`) - ID format validation
- **AdaptError / validation logic** (`adapters/`) - Adaptation between layers

### What is Excluded

- Database implementations
- Normalize logic
- UI / ViewModel
- Repository implementations
- External I/O

## Type Rules

### Time Fields

All time fields in Contract MUST be `Date` type.
String conversion (ISO format) is the **Presentation layer's responsibility**.

```typescript
// Contract layer - always Date
interface LtsMicropostDocument {
  createdAt: Date // NOT string
  updatedAt: Date // NOT string
}

// Presentation layer - converts for JSON
const response = {
  ...document,
  createdAt: document.createdAt.toISOString(),
  updatedAt: document.updatedAt.toISOString(),
}
```

### ID Types

Branded types are used for type safety:

- `MicropostId` - MongoDB ObjectId format
- `SettingsId` - Timestamp-based format
- `UserId` - Clerk user ID format

## Usage

### Adapting Domain Entities

```typescript
import { adaptMicropostToLtsV1, AdaptError } from '@/contracts/lts-v1'

try {
  const ltsDoc = adaptMicropostToLtsV1(domainMicropost)
  // Use ltsDoc for external API, serialization, etc.
} catch (e) {
  if (e instanceof AdaptError) {
    console.error(`Adaptation failed: ${e.code}`, e.details)
  }
}
```

### Validating Incoming Data

```typescript
import { IdValidators, TimePolicy } from '@/contracts/lts-v1'

if (!IdValidators.isMicropostId(id)) {
  throw new Error('Invalid micropost ID')
}

if (!TimePolicy.isValidTimestamp(date)) {
  throw new Error('Invalid timestamp')
}
```

## Change Policy

1. **lts-v1 is frozen** once created
2. Any breaking changes require creating **v2**
3. Non-breaking additions (new optional fields) may be added with caution
4. All changes must be documented in CHANGELOG

## File Structure

```
lts-v1/
├── index.ts           # Public API exports
├── README.md          # This file
├── documents/         # Document type definitions
│   ├── index.ts
│   ├── micropost.ts   # LtsMicropostDocument
│   └── settings.ts    # LtsSettingsDocument
├── types/             # Core types
│   ├── index.ts
│   ├── ids.ts         # ID type definitions
│   ├── time.ts        # TimePolicy
│   └── common.ts      # Common types
└── adapters/          # Adaptation logic
    ├── index.ts
    ├── errors.ts      # AdaptError
    ├── micropost.ts   # Micropost adapters
    └── settings.ts    # Settings adapters
```
