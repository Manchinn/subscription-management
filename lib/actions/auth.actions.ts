'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString()
      if (field) fieldErrors[field] = issue.message
    }
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const email = parsed.data.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({
    where: { email },
  })
  if (existing) {
    return { success: false, error: 'Email already exists' }
  }

  const hash = await bcrypt.hash(parsed.data.password, 10)
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      password: hash,
    },
  })

  return { success: true }
}
