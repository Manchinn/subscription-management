import { daysUntil, formatCurrency } from '@/lib/utils'
import type { SubscriptionWithCategory } from '@/types'

interface AlertStripProps {
  subscriptions: SubscriptionWithCategory[]
}

export function AlertStrip({ subscriptions }: AlertStripProps) {
  if (subscriptions.length === 0) return null

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
          Due within 7 days
        </p>
      </div>
      <ul className="space-y-2">
        {subscriptions.map((sub) => {
          const days = daysUntil(new Date(sub.nextBillingDate))
          return (
            <li key={sub.id} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-900">
                {sub.logoEmoji && <span className="mr-1.5">{sub.logoEmoji}</span>}
                {sub.name}
              </span>
              <span className="text-sm font-bold text-orange-700">
                {days === 0 ? 'Today' : `${days}d`} · {formatCurrency(Number(sub.cost), sub.currency)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
