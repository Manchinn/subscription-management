'use client'
import { useRef, useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/settings.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfile} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={userName} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Input id="defaultCurrency" name="defaultCurrency" defaultValue={defaultCurrency} placeholder="THB" maxLength={3} />
            </div>
            {profileMsg && <p className={`text-sm ${profileMsg === 'Saved!' ? 'text-green-600' : 'text-destructive'}`}>{profileMsg}</p>}
            <Button type="submit" disabled={pending} size="sm">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form ref={passwordFormRef} onSubmit={handlePassword} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" />
            </div>
            {pwMsg && <p className={`text-sm ${pwMsg === 'Password updated!' ? 'text-green-600' : 'text-destructive'}`}>{pwMsg}</p>}
            <Button type="submit" disabled={pending} size="sm">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
        Sign Out
      </Button>
    </div>
  )
}
