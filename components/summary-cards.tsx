import { formatCurrency } from '@/lib/utils'
import type { CurrencyTotal } from '@/lib/utils'

interface SummaryCardsProps {
  currencyTotals: CurrencyTotal[]
  activeCount: number
  /** Used when there are no subscriptions yet */
  fallbackCurrency: string
}

function formatTotals(
  currencyTotals: CurrencyTotal[],
  key: 'monthlyTotal' | 'yearlyTotal',
  fallbackCurrency: string,
): string | string[] {
  if (currencyTotals.length === 0) {
    return formatCurrency(0, fallbackCurrency)
  }

  if (currencyTotals.length === 1) {
    return formatCurrency(currencyTotals[0][key], currencyTotals[0].currency)
  }

  // Multiple currencies: return as array for vertical stacking
  return currencyTotals.map((ct) => formatCurrency(ct[key], ct.currency))
}

function TotalDisplay({ value }: { value: string | string[] }) {
  if (typeof value === 'string') {
    return <p className="mt-1 text-sm font-semibold">{value}</p>
  }

  return (
    <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
      {value.map((v) => (
        <p key={v} className="truncate text-xs font-semibold">{v}</p>
      ))}
    </div>
  )
}

export function SummaryCards({ currencyTotals, activeCount, fallbackCurrency }: SummaryCardsProps) {
  const monthlyTotals = formatTotals(currencyTotals, 'monthlyTotal', fallbackCurrency)
  const yearlyTotals = formatTotals(currencyTotals, 'yearlyTotal', fallbackCurrency)

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">Monthly</p>
        <TotalDisplay value={monthlyTotals} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">Yearly</p>
        <TotalDisplay value={yearlyTotals} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">Active</p>
        <p className="mt-1 text-sm font-semibold">{activeCount}</p>
      </div>
    </div>
  )
}
