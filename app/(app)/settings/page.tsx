import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings-form'
import { SignOutButton } from '@/components/sign-out-button'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings | Subscription Tracker',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user, categoryCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, defaultCurrency: true },
    }),
    prisma.category.count({ where: { userId: session.user.id } }),
  ])

  if (!user) redirect('/login')

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight">Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your profile and preferences</p>
      </div>
      <div className="space-y-4">
        <SettingsForm
          userName={user.name ?? ''}
          defaultCurrency={user.defaultCurrency}
        />
        <Link
          href="/settings/categories"
          className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryCount} custom {categoryCount === 1 ? 'category' : 'categories'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <SignOutButton />
      </div>
    </div>
  )
}
