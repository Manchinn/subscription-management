'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerUser } from '@/lib/actions/auth.actions'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    try {
      const result = await registerUser(data)
      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        setError(result.error ?? 'Registration failed')
        return
      }
      router.push('/login?registered=true')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-2xl text-white shadow-lg shadow-teal-500/25">
          💳
        </div>
        <h1 className="text-xl font-bold tracking-tight">Subscription Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && !Object.keys(fieldErrors).length && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input id="name" name="name" type="text" required autoFocus />
            {fieldErrors.name && (
              <p className="text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input id="email" name="email" type="email" required />
            {fieldErrors.email && (
              <p className="text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input id="password" name="password" type="password" required />
            {fieldErrors.password && (
              <p className="text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
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
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
          Login
        </Link>
      </p>
    </div>
  )
}
