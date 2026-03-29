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

function TotalDisplay({
  value,
  colorClass = 'text-teal-900',
}: {
  value: string | string[]
  colorClass?: string
}) {
  if (typeof value === 'string') {
    return <p className={`mt-1 text-lg font-bold ${colorClass}`}>{value}</p>
  }

  return (
    <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
      {value.map((v) => (
        <p key={v} className={`truncate text-sm font-bold ${colorClass}`}>
          {v}
        </p>
      ))}
    </div>
  )
}

export function SummaryCards({ currencyTotals, activeCount, fallbackCurrency }: SummaryCardsProps) {
  const monthlyTotals = formatTotals(currencyTotals, 'monthlyTotal', fallbackCurrency)
  const yearlyTotals = formatTotals(currencyTotals, 'yearlyTotal', fallbackCurrency)

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-cyan-50/50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">Monthly</p>
        <TotalDisplay value={monthlyTotals} colorClass="text-teal-900" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-cyan-50/50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">Yearly</p>
        <TotalDisplay value={yearlyTotals} colorClass="text-teal-900" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-green-50/50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">Active</p>
        <p className="mt-1 text-2xl font-bold text-emerald-900">{activeCount}</p>
      </div>
    </div>
  )
}
