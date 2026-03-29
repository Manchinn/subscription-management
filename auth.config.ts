import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config — no bcrypt, no Prisma, no Node.js-only modules
// Used by proxy.ts (Edge runtime) for session checking only
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (typeof token.id === 'string') session.user.id = token.id
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
