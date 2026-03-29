import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client'
import {
  groupTotalsByCurrency,
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

export const metadata: Metadata = {
  title: 'Dashboard | Subscription Tracker',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user, subs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id, status: Status.ACTIVE },
      include: { category: true },
      orderBy: { nextBillingDate: 'asc' },
    }),
  ])

  if (!user) redirect('/login')

  const currencyTotals = groupTotalsByCurrency(subs)

  const alertSubs = subs.filter((s) => isAlertingSoon(new Date(s.nextBillingDate)))
  const upcomingSubs = subs.filter((s) => isUpcoming(new Date(s.nextBillingDate)))

  return (
    <div className="space-y-5">
      <SummaryCards
        currencyTotals={currencyTotals}
        activeCount={subs.length}
        fallbackCurrency={user.defaultCurrency}
      />

      <AlertStrip subscriptions={alertSubs} />

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                <li
                  key={sub.id}
                >
                  <Link
                    href={`/subscriptions/${sub.id}`}
                    className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition-colors active:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sub.logoEmoji ?? sub.category.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.nextBillingDate), 'MMM d')} ·{' '}
                          {days === 0 ? 'today' : `${days} days`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${isAlert ? 'text-orange-600' : 'text-teal-700'}`}
                    >
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
