import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

// NOTE: /api/* routes (except /api/auth) must be protected via auth() in each handler
export const config = {
  matcher: ['/dashboard/:path*', '/subscriptions/:path*', '/settings/:path*'],
}
