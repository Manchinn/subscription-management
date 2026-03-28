import { daysUntil, formatCurrency } from '@/lib/utils'
import type { SubscriptionWithCategory } from '@/types'

interface AlertStripProps {
  subscriptions: SubscriptionWithCategory[]
}

export function AlertStrip({ subscriptions }: AlertStripProps) {
  if (subscriptions.length === 0) return null

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="mb-2 text-xs font-semibold text-orange-700 uppercase tracking-wide">
        Due within 7 days
      </p>
      <ul className="space-y-1.5">
        {subscriptions.map((sub) => {
          const days = daysUntil(new Date(sub.nextBillingDate))
          return (
            <li key={sub.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-orange-900">
                {sub.logoEmoji && <span className="mr-1">{sub.logoEmoji}</span>}
                {sub.name}
              </span>
              <span className="text-orange-700">
                {days === 0 ? 'Today' : `${days}d`} · {formatCurrency(Number(sub.cost), sub.currency)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
