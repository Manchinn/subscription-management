import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { SubscriptionForm } from '@/components/subscription-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSubscriptionPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const { id } = await params

  const [subscription, categories, user] = await Promise.all([
    prisma.subscription.findUnique({
      where: { id, userId: session.user.id },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: session.user.id }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  if (!subscription) notFound()

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
          <h2 className="text-lg font-bold tracking-tight">Edit Subscription</h2>
          <p className="text-xs text-muted-foreground">{subscription.name}</p>
        </div>
      </div>
      <SubscriptionForm
        categories={categories}
        defaultCategoryId={subscription.categoryId}
        defaultCurrency={user?.defaultCurrency ?? 'THB'}
        initialData={{
          id: subscription.id,
          name: subscription.name,
          description: subscription.description ?? undefined,
          cost: Number(subscription.cost),
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          nextBillingDate: subscription.nextBillingDate,
          categoryId: subscription.categoryId,
          paymentMethod: subscription.paymentMethod ?? undefined,
          logoUrl: subscription.logoUrl ?? undefined,
          logoEmoji: subscription.logoEmoji ?? undefined,
          status: subscription.status,
          notes: subscription.notes ?? undefined,
        }}
      />
    </div>
  )
}
