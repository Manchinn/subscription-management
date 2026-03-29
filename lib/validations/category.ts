import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  icon: z.string().trim().min(1, 'Icon is required').max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
})

export type CategoryFormData = z.infer<typeof categorySchema>
