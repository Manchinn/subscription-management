import type { Subscription, Category, BillingCycle, Status } from '@prisma/client'

export type SubscriptionWithCategory = Subscription & {
  category: Category
}

export type { BillingCycle, Status }
