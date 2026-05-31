import { z } from 'zod'

export const createMicropostSchema = z.object({
  title: z
    .unknown()
    .transform((val) => (typeof val === 'string' ? val.trim() : ''))
    .pipe(z.string().min(1, 'Title is required').max(255, 'Title is too long')),
  body: z
    .unknown()
    .transform((val) => (typeof val === 'string' ? val.trim() : ''))
    .pipe(z.string().min(1, 'Body is required').max(10000, 'Body is too long')),
  status: z
    .enum(['draft', 'published'])
    .default('draft')
    .optional()
    .transform((val) => val ?? 'draft'),
})

export const updateMicropostSchema = z.object({
  title: z
    .unknown()
    .transform((val) => (typeof val === 'string' ? val.trim() : ''))
    .pipe(z.string().min(1, 'Title is required').max(255, 'Title is too long')),
  body: z
    .unknown()
    .transform((val) => (typeof val === 'string' ? val.trim() : ''))
    .pipe(z.string().min(1, 'Body is required').max(10000, 'Body is too long')),
  status: z.enum(['draft', 'published']),
})

export type CreateMicropostInput = z.infer<typeof createMicropostSchema>
export type UpdateMicropostInput = z.infer<typeof updateMicropostSchema>
