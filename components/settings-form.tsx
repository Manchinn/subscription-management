'use client'
import { useRef, useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/settings.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signOut } from 'next-auth/react'

interface SettingsFormProps {
  userName: string
  defaultCurrency: string
}

export function SettingsForm({ userName, defaultCurrency }: SettingsFormProps) {
  const [pending, startTransition] = useTransition()
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const passwordFormRef = useRef<HTMLFormElement>(null)

  function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileMsg('')
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile({
        name: data.get('name') as string,
        defaultCurrency: data.get('defaultCurrency') as string,
      })
      if (!result || !result.success) {
        setProfileMsg(result?.error ?? 'Failed to save')
        return
      }
      setProfileMsg('Saved!')
    })
  }

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwMsg('')
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePassword({
        currentPassword: data.get('currentPassword') as string,
        newPassword: data.get('newPassword') as string,
      })
      if (!result || !result.success) {
        setPwMsg(result?.error ?? 'Failed')
        return
      }
      setPwMsg('Password updated!')
      passwordFormRef.current?.reset()
    })
  }

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="form-section form-section-delay-0">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Profile</p>
          <form onSubmit={handleProfile} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={userName} className="text-base font-medium" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Input
                id="defaultCurrency"
                name="defaultCurrency"
                defaultValue={defaultCurrency}
                placeholder="THB"
                maxLength={3}
                className="text-center uppercase text-sm font-semibold"
              />
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg === 'Saved!' ? 'text-emerald-600' : 'text-destructive'}`}>
                {profileMsg}
              </p>
            )}
            <Button type="submit" disabled={pending} size="sm" className="rounded-xl hover:shadow-md active:scale-[0.98] transition-transform">
              Save
            </Button>
          </form>
        </div>
      </div>

      {/* Password Card */}
      <div className="form-section form-section-delay-1">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Change Password</p>
          <form ref={passwordFormRef} onSubmit={handlePassword} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg === 'Password updated!' ? 'text-emerald-600' : 'text-destructive'}`}>
                {pwMsg}
              </p>
            )}
            <Button type="submit" disabled={pending} size="sm" className="rounded-xl hover:shadow-md active:scale-[0.98] transition-transform">
              Update Password
            </Button>
          </form>
        </div>
      </div>

      {/* Sign Out */}
      <div className="form-section form-section-delay-2">
        <Button
          variant="outline"
          className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 py-5 font-medium active:scale-[0.98] transition-transform"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
