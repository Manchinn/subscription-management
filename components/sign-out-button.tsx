'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 py-5 font-medium active:scale-[0.98] transition-transform"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Sign Out
    </Button>
  )
}
