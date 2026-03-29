'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === 'true'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = new FormData(e.currentTarget)
    try {
      const res = await signIn('credentials', {
        email: data.get('email'),
        password: data.get('password'),
        redirect: false,
      })

      if (!res || res.error) {
        setError('Invalid email or password')
        return
      }
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="form-section rounded-2xl border bg-card p-6 shadow-sm" style={{ animationDelay: '0ms' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {registered && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-medium">
              Account created! Please login.
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input id="email" name="email" type="email" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl py-5 text-base font-semibold shadow-md active:scale-[0.98] transition-transform"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="spinner h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
          Register
        </Link>
      </p>
    </>
  )
}
