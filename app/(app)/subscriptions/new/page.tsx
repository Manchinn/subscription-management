import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SubscriptionForm } from '@/components/subscription-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewSubscriptionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [categories, user] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: session.user.id }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  const otherCategory = categories.find((c) => c.slug === 'other' && c.userId === null)

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/subscriptions"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-lg font-bold tracking-tight">New Subscription</h2>
          <p className="text-xs text-muted-foreground">Track a new recurring payment</p>
        </div>
      </div>
      <SubscriptionForm
        categories={categories}
        defaultCategoryId={otherCategory?.id ?? categories[0].id}
        defaultCurrency={user?.defaultCurrency ?? 'THB'}
      />
    </div>
  )
}
