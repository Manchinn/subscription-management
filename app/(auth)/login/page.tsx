import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Sign In | Subscription Tracker',
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-2xl text-white shadow-lg shadow-teal-500/25">
          💳
        </div>
        <h1 className="text-xl font-bold tracking-tight">Subscription Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your subscriptions
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
