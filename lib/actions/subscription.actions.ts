'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subscriptionSchema, type SubscriptionFormData } from '@/lib/validations/subscription'

export type ActionResult<T = undefined> = {
  success: boolean
  error?: string
  data?: T
}

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

export async function createSubscription(
  data: SubscriptionFormData
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = subscriptionSchema.safeParse(data)

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, OR: [{ userId: null }, { userId }] },
    })
    if (!category) {
      return { success: false, error: 'Invalid category' }
    }

    await prisma.subscription.create({
      data: { ...parsed.data, userId },
    })

    revalidatePath('/dashboard')
    revalidatePath('/subscriptions')
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('createSubscription error:', error)
    return { success: false, error: 'Something went wrong' }
  }

  redirect('/subscriptions')
}

export async function updateSubscription(
  id: string,
  data: SubscriptionFormData
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = subscriptionSchema.safeParse(data)

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, OR: [{ userId: null }, { userId }] },
    })
    if (!category) {
      return { success: false, error: 'Invalid category' }
    }

    await prisma.subscription.update({
      where: { id, userId },
      data: { ...parsed.data },
    })

    revalidatePath('/dashboard')
    revalidatePath('/subscriptions')
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('updateSubscription error:', error)
    return { success: false, error: 'Something went wrong' }
  }

  redirect('/subscriptions')
}

export async function deleteSubscription(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()

    await prisma.subscription.delete({ where: { id, userId } })

    revalidatePath('/dashboard')
    revalidatePath('/subscriptions')
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('deleteSubscription error:', error)
    return { success: false, error: 'Something went wrong' }
  }

  redirect('/subscriptions')
}
