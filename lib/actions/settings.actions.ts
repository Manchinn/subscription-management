'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import bcrypt from 'bcryptjs'
import type { ActionResult } from './subscription.actions'

const profileSchema = z.object({
  name: z.string().min(1),
  defaultCurrency: z.string().min(3).max(3).toUpperCase(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export async function updateProfile(
  data: z.infer<typeof profileSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const parsed = profileSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    })

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('updateProfile error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}

export async function updatePassword(
  data: z.infer<typeof passwordSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const parsed = passwordSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) {
      return { success: false, error: 'No password set for this account' }
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
    if (!valid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const hash = await bcrypt.hash(parsed.data.newPassword, 10)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hash } })

    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('updatePassword error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}
