import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client'
import {
  calculateMonthlyCost,
  isAlertingSoon,
  isUpcoming,
  formatCurrency,
  daysUntil,
} from '@/lib/utils'
import { SummaryCards } from '@/components/summary-cards'
import { AlertStrip } from '@/components/alert-strip'
import type { SubscriptionWithCategory } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: Status.ACTIVE },
        include: { category: true },
        orderBy: { nextBillingDate: 'asc' },
      },
    },
  })

  if (!user) redirect('/login')

  const subs = user.subscriptions as SubscriptionWithCategory[]

  const monthlyTotal = subs.reduce(
    (sum, s) => sum + calculateMonthlyCost(s.cost, s.billingCycle),
    0
  )
  const yearlyTotal = monthlyTotal * 12

  const alertSubs = subs.filter((s) => isAlertingSoon(new Date(s.nextBillingDate)))
  const upcomingSubs = subs.filter((s) => isUpcoming(new Date(s.nextBillingDate)))

  return (
    <div className="space-y-4">
      <SummaryCards
        monthlyTotal={monthlyTotal}
        yearlyTotal={yearlyTotal}
        activeCount={subs.length}
        currency={user.defaultCurrency}
      />

      <AlertStrip subscriptions={alertSubs} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Upcoming (30 days)
        </h2>
        {upcomingSubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bills</p>
        ) : (
          <ul className="space-y-2">
            {upcomingSubs.map((sub) => {
              const days = daysUntil(new Date(sub.nextBillingDate))
              const isAlert = isAlertingSoon(new Date(sub.nextBillingDate))
              return (
                <li key={sub.id}>
                  <Link
                    href={`/subscriptions/${sub.id}`}
                    className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm active:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{sub.logoEmoji ?? sub.category.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.nextBillingDate), 'MMM d')} ·{' '}
                          {days === 0 ? 'today' : `${days} days`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${isAlert ? 'text-orange-600' : ''}`}>
                      {formatCurrency(Number(sub.cost), sub.currency)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
