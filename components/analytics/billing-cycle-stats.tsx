import { formatCurrency } from '@/lib/utils'
import type { BillingCycleStat } from '@/lib/utils'
import { BillingCycle } from '@prisma/client'

const CYCLE_CONFIG: Record<BillingCycle, { label: string; icon: string }> = {
  MONTHLY: { label: 'Monthly', icon: '📅' },
  QUARTERLY: { label: 'Quarterly', icon: '📊' },
  YEARLY: { label: 'Yearly', icon: '📆' },
}

interface Props {
  data: BillingCycleStat[]
  currency: string
}

export function BillingCycleStats({ data, currency }: Props) {
  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No subscriptions</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {data.map((stat) => {
        const config = CYCLE_CONFIG[stat.cycle]
        return (
          <div key={stat.cycle} className="rounded-xl border bg-card p-3 text-center shadow-sm">
            <span className="text-lg">{config.icon}</span>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{stat.count}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stat.monthlyTotal, currency)}/mo</p>
          </div>
        )
      })}
    </div>
  )
}
