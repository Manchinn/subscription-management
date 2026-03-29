import { z } from 'zod'
import { BillingCycle, Status } from '@prisma/client'

export const subscriptionSchema = z.object({
  name:            z.string().min(1, 'Name is required'),
  description:     z.string().optional(),
  cost:            z.coerce.number().positive('Cost must be positive'),
  currency:        z.string().default('THB'),
  billingCycle:    z.nativeEnum(BillingCycle),
  nextBillingDate: z.coerce.date(),
  categoryId:      z.string().min(1),
  paymentMethod:   z.string().optional(),
  logoUrl:         z.string().url().optional().or(z.literal('')),
  logoEmoji:       z.string().optional(),
  status:          z.nativeEnum(Status).default('ACTIVE'),
  notes:           z.string().optional(),
})

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>
