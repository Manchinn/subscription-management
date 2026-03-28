import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SubscriptionForm } from '@/components/subscription-form'

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
      <h2 className="mb-4 text-lg font-semibold">Add Subscription</h2>
      <SubscriptionForm
        categories={categories}
        defaultCategoryId={otherCategory?.id ?? categories[0].id}
        defaultCurrency={user?.defaultCurrency ?? 'THB'}
      />
    </div>
  )
}
