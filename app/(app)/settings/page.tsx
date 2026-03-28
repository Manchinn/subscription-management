'use client'
import { useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/settings.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession, signOut } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [pending, startTransition] = useTransition()
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateProfile({
          name: data.get('name') as string,
          defaultCurrency: data.get('defaultCurrency') as string,
        })
        setProfileMsg('Saved!')
      } catch {
        setProfileMsg('Failed to save')
      }
    })
  }

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updatePassword({
          currentPassword: data.get('currentPassword') as string,
          newPassword: data.get('newPassword') as string,
        })
        setPwMsg('Password updated!')
        ;(e.target as HTMLFormElement).reset()
      } catch (err: unknown) {
        setPwMsg(err instanceof Error ? err.message : 'Failed')
      }
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
              <Input id="name" name="name" defaultValue={session?.user?.name ?? ''} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Input id="defaultCurrency" name="defaultCurrency" defaultValue="THB" placeholder="THB" maxLength={3} />
            </div>
            {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
            <Button type="submit" disabled={pending} size="sm">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePassword} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" />
            </div>
            {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
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
