'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

export async function createSubscription(data: z.infer<typeof subscriptionSchema>) {
  const userId = await requireUserId()
  const parsed = subscriptionSchema.parse(data)

  await prisma.subscription.create({
    data: { ...parsed, userId, cost: parsed.cost },
  })

  revalidatePath('/dashboard')
  revalidatePath('/subscriptions')
  redirect('/subscriptions')
}

export async function updateSubscription(
  id: string,
  data: z.infer<typeof subscriptionSchema>
) {
  const userId = await requireUserId()
  const parsed = subscriptionSchema.parse(data)

  await prisma.subscription.update({
    where: { id, userId },
    data: { ...parsed, cost: parsed.cost },
  })

  revalidatePath('/dashboard')
  revalidatePath('/subscriptions')
  redirect('/subscriptions')
}

export async function deleteSubscription(id: string) {
  const userId = await requireUserId()

  await prisma.subscription.delete({ where: { id, userId } })

  revalidatePath('/dashboard')
  revalidatePath('/subscriptions')
}
