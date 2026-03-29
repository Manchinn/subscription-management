import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays } from 'date-fns'
import { BillingCycle } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateMonthlyCost(cost: Decimal, cycle: BillingCycle): number {
  const n = Number(cost)
  switch (cycle) {
    case BillingCycle.MONTHLY:   return n
    case BillingCycle.YEARLY:    return n / 12
    case BillingCycle.QUARTERLY: return n / 3
  }
}

export function calculateYearlyCost(cost: Decimal, cycle: BillingCycle): number {
  return calculateMonthlyCost(cost, cycle) * 12
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function daysUntil(date: Date): number {
  return differenceInCalendarDays(date, new Date())
}

export function isAlertingSoon(date: Date, thresholdDays = 7): boolean {
  const d = daysUntil(date)
  return d >= 0 && d <= thresholdDays
}

export function isUpcoming(date: Date, thresholdDays = 30): boolean {
  const d = daysUntil(date)
  return d >= 0 && d <= thresholdDays
}

export interface CurrencyTotal {
  currency: string
  monthlyTotal: number
  yearlyTotal: number
}

/**
 * Group subscriptions by currency and calculate totals per currency.
 */
export function groupTotalsByCurrency(
  subs: { cost: Decimal; billingCycle: BillingCycle; currency: string }[]
): CurrencyTotal[] {
  const map = new Map<string, number>()

  for (const s of subs) {
    const monthly = calculateMonthlyCost(s.cost, s.billingCycle)
    map.set(s.currency, (map.get(s.currency) ?? 0) + monthly)
  }

  return Array.from(map.entries()).map(([currency, monthlyTotal]) => ({
    currency,
    monthlyTotal,
    yearlyTotal: monthlyTotal * 12,
  }))
}
