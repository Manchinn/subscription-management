import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SubscriptionCard } from '@/components/subscription-card'
import { CategoryFilter } from '@/components/category-filter'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { SubscriptionWithCategory } from '@/types'

export const metadata: Metadata = {
  title: 'Subscriptions | Subscription Tracker',
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function SubscriptionsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const { category } = await searchParams

  const usedCategories = await prisma.category.findMany({
    where: {
      subscriptions: { some: { userId: session.user.id } },
    },
    orderBy: { name: 'asc' },
  })

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { category: true },
    orderBy: { nextBillingDate: 'asc' },
  }) satisfies SubscriptionWithCategory[]

  return (
    <div className="space-y-5">
      <Suspense>
        <CategoryFilter categories={usedCategories} />
      </Suspense>

      {subscriptions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No subscriptions yet
        </p>
      ) : (
        <ul className="space-y-2">
          {subscriptions.map((sub) => (
            <li key={sub.id}>
              <SubscriptionCard subscription={sub} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/subscriptions/new"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
