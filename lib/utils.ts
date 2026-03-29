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
  try {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
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

export interface CategorySpending {
  name: string
  color: string
  icon: string
  total: number
}

export interface SubscriptionCostRank {
  name: string
  emoji: string
  monthlyCost: number
}

export interface BillingCycleStat {
  cycle: BillingCycle
  count: number
  monthlyTotal: number
}

export function groupByCategory(
  subs: { cost: Decimal; billingCycle: BillingCycle; category: { name: string; color: string; icon: string } }[]
): CategorySpending[] {
  const map = new Map<string, CategorySpending>()
  for (const s of subs) {
    const key = s.category.name
    const existing = map.get(key)
    const monthly = calculateMonthlyCost(s.cost, s.billingCycle)
    if (existing) {
      existing.total += monthly
    } else {
      map.set(key, { name: s.category.name, color: s.category.color, icon: s.category.icon, total: monthly })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

export function rankByMonthlyCost(
  subs: { name: string; logoEmoji: string | null; cost: Decimal; billingCycle: BillingCycle; category: { icon: string } }[]
): SubscriptionCostRank[] {
  return subs
    .map((s) => ({
      name: s.name,
      emoji: s.logoEmoji ?? s.category.icon,
      monthlyCost: calculateMonthlyCost(s.cost, s.billingCycle),
    }))
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 8)
}

export function groupByBillingCycle(
  subs: { cost: Decimal; billingCycle: BillingCycle }[]
): BillingCycleStat[] {
  const map = new Map<BillingCycle, BillingCycleStat>()
  for (const s of subs) {
    const existing = map.get(s.billingCycle)
    const monthly = calculateMonthlyCost(s.cost, s.billingCycle)
    if (existing) {
      existing.count++
      existing.monthlyTotal += monthly
    } else {
      map.set(s.billingCycle, { cycle: s.billingCycle, count: 1, monthlyTotal: monthly })
    }
  }
  return Array.from(map.values())
}
