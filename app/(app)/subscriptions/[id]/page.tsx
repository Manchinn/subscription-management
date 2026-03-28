import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { SubscriptionForm } from '@/components/subscription-form'

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
      <h2 className="mb-4 text-lg font-semibold">Edit Subscription</h2>
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
