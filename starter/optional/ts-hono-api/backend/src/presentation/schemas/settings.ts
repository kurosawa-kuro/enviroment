import { z } from 'zod'

export const settingsSchema = z.object({
  isCloud: z.boolean({ error: 'isCloud must be a boolean' }),
  isStub: z.boolean({ error: 'isStub must be a boolean' }),
  aiModel: z
    .string({ error: 'aiModel must be a string' })
    .transform((val) => val.trim())
    .pipe(z.string().min(1, 'aiModel must be a non-empty string'))
})
