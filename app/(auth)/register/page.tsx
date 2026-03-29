import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Register | Subscription Tracker',
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
