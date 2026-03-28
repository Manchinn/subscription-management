import { formatCurrency } from '@/lib/utils'

interface SummaryCardsProps {
  monthlyTotal: number
  yearlyTotal: number
  activeCount: number
  currency: string
}

export function SummaryCards({ monthlyTotal, yearlyTotal, activeCount, currency }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">Monthly</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(monthlyTotal, currency)}</p>
      </div>
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">Yearly</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(yearlyTotal, currency)}</p>
      </div>
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">Active</p>
        <p className="mt-1 text-sm font-semibold">{activeCount}</p>
      </div>
    </div>
  )
}
