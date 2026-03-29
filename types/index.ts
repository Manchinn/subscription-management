import type { Prisma, BillingCycle, Status } from '@prisma/client'

export type SubscriptionWithCategory = Prisma.SubscriptionGetPayload<{
  include: { category: true }
}>

export type { BillingCycle, Status }
