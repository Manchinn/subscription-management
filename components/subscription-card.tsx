import Link from 'next/link'
import { format } from 'date-fns'
import { formatCurrency, daysUntil, isAlertingSoon } from '@/lib/utils'
import { SubscriptionLogo } from '@/components/subscription-logo'
import type { SubscriptionWithCategory } from '@/types'
import { Status } from '@prisma/client'

interface SubscriptionCardProps {
  subscription: SubscriptionWithCategory
}

const STATUS_COLORS: Record<Status, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export function SubscriptionCard({ subscription: sub }: SubscriptionCardProps) {
  const days = daysUntil(new Date(sub.nextBillingDate))
  const alert = isAlertingSoon(new Date(sub.nextBillingDate))

  return (
    <Link
      href={`/subscriptions/${sub.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm active:bg-accent"
    >
      <SubscriptionLogo
        logoUrl={sub.logoUrl}
        logoEmoji={sub.logoEmoji}
        categoryIcon={sub.category.icon}
        name={sub.name}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{sub.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sub.status]}`}>
            {sub.status.toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span
            className="inline-block rounded px-1"
            style={{ background: sub.category.color + '22', color: sub.category.color }}
          >
            {sub.category.icon} {sub.category.name}
          </span>
          {' · '}
          {format(new Date(sub.nextBillingDate), 'MMM d')}
          {alert && <span className="ml-1 text-orange-500">({days === 0 ? 'today' : `${days}d`})</span>}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${alert ? 'text-orange-600' : ''}`}>
        {formatCurrency(Number(sub.cost), sub.currency)}
      </p>
    </Link>
  )
}
