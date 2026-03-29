import { z } from 'zod'
import { BillingCycle, Status } from '@prisma/client'

export const subscriptionSchema = z.object({
  name:            z.string().min(1, 'Name is required').max(100),
  description:     z.string().max(500).optional(),
  cost:            z.coerce.number().positive('Cost must be positive'),
  currency:        z.string().min(3).max(3).toUpperCase().default('THB'),
  billingCycle:    z.nativeEnum(BillingCycle),
  nextBillingDate: z.coerce.date(),
  categoryId:      z.string().min(1),
  paymentMethod:   z.string().max(50).optional(),
  logoUrl:         z.string().url().refine((url) => url.startsWith('https://'), { message: 'Must be an HTTPS URL' }).optional().or(z.literal('')),
  logoEmoji:       z.string().max(10).optional(),
  status:          z.nativeEnum(Status).default('ACTIVE'),
  notes:           z.string().max(1000).optional(),
})

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>
