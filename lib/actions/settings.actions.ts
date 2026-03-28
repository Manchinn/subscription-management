'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

const profileSchema = z.object({
  name: z.string().min(1),
  defaultCurrency: z.string().min(3).max(3).toUpperCase(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const parsed = profileSchema.parse(data)
  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed,
  })
  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const parsed = passwordSchema.parse(data)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) throw new Error('No password set')

  const valid = await bcrypt.compare(parsed.currentPassword, user.password)
  if (!valid) throw new Error('Current password is incorrect')

  const hash = await bcrypt.hash(parsed.newPassword, 10)
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hash } })
}
