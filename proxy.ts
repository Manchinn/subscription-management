import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

// Use edge-compatible authConfig only (no bcrypt/Prisma)
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (!req.auth) return NextResponse.redirect(new URL('/login', req.url))
})

export const config = {
  matcher: ['/dashboard/:path*', '/subscriptions/:path*', '/settings/:path*'],
}
