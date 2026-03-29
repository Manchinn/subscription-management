import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Settings | Subscription Tracker',
}
import { SettingsForm } from '@/components/settings-form'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, defaultCurrency: true },
  })

  if (!user) redirect('/login')

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight">Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your profile and preferences</p>
      </div>
      <SettingsForm
        userName={user.name ?? ''}
        defaultCurrency={user.defaultCurrency}
      />
    </div>
  )
}
