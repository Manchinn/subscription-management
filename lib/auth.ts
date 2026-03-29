import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from '@/auth.config'
import { isRateLimited, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase().trim()
        const rateLimitKey = `login:${email}`
        const { blocked } = isRateLimited(rateLimitKey)
        if (blocked) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })
        if (!user?.password) {
          recordFailedAttempt(rateLimitKey)
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) {
          recordFailedAttempt(rateLimitKey)
          return null
        }

        resetRateLimit(rateLimitKey)
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
})
