'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { isRateLimited, recordFailedAttempt } from '@/lib/rate-limit'

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
  if (process.env.REGISTRATION_ENABLED !== 'true') {
    return { success: false, error: 'Registration is currently closed.' }
  }

  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString()
      if (field) fieldErrors[field] = issue.message
    }
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const rateLimitKey = `register:${parsed.data.email.toLowerCase()}`
  const { blocked } = isRateLimited(rateLimitKey)
  if (blocked) {
    return { success: false, error: 'Too many attempts. Please try again later.' }
  }

  const email = parsed.data.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({
    where: { email },
  })
  if (existing) {
    recordFailedAttempt(rateLimitKey)
    return { success: false, error: 'Registration failed. Please try again or login.' }
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
