import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

// Use edge-compatible authConfig only (no bcrypt/Prisma)
const { auth } = NextAuth(authConfig)

const protectedPrefixes = ['/dashboard', '/subscriptions', '/settings']

export default auth((req) => {
  const isProtected = protectedPrefixes.some((p) =>
    req.nextUrl.pathname.startsWith(p)
  )
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
}
