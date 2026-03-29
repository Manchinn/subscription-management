import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client'
import { groupByCategory, rankByMonthlyCost, groupByBillingCycle } from '@/lib/utils'
import { SpendingDonut } from '@/components/analytics/spending-donut'
import { CostBarChart } from '@/components/analytics/cost-bar-chart'
import { BillingCycleStats } from '@/components/analytics/billing-cycle-stats'

export const metadata: Metadata = {
  title: 'Analytics | Subscription Tracker',
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: { category: true },
    }),
  ])

  if (!user) redirect('/login')

  const activeSubs = subscriptions.filter((s) => s.status === Status.ACTIVE)
  const currency = user.defaultCurrency

  const categoryData = groupByCategory(activeSubs)
  const costRanking = rankByMonthlyCost(activeSubs)
  const cycleStats = groupByBillingCycle(activeSubs)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Analytics</h2>
        <p className="text-xs text-muted-foreground">Spending overview for active subscriptions</p>
      </div>

      {/* Spending by Category */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Spending by Category
        </h3>
        <SpendingDonut data={categoryData} currency={currency} />
      </section>

      {/* Billing Cycle Breakdown */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Billing Cycle
        </h3>
        <BillingCycleStats data={cycleStats} currency={currency} />
      </section>

      {/* Top Subscriptions by Cost */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Top Subscriptions
        </h3>
        <CostBarChart data={costRanking} currency={currency} />
      </section>
    </div>
  )
}
