import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyCost,
  calculateYearlyCost,
  formatCurrency,
  daysUntil,
  isAlertingSoon,
  isUpcoming,
  groupTotalsByCurrency,
} from '@/lib/utils'
import { BillingCycle } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/client'

const dec = (v: number) => v as unknown as Decimal

describe('calculateMonthlyCost', () => {
  it('returns cost as-is for MONTHLY', () => {
    expect(calculateMonthlyCost(dec(100), BillingCycle.MONTHLY)).toBeCloseTo(100)
  })
  it('divides by 12 for YEARLY', () => {
    expect(calculateMonthlyCost(dec(1200), BillingCycle.YEARLY)).toBeCloseTo(100)
  })
  it('divides by 3 for QUARTERLY', () => {
    expect(calculateMonthlyCost(dec(300), BillingCycle.QUARTERLY)).toBeCloseTo(100)
  })
  it('works with real Prisma Decimal', () => {
    expect(calculateMonthlyCost(new Decimal('1200'), BillingCycle.YEARLY)).toBeCloseTo(100)
  })
})

describe('calculateYearlyCost', () => {
  it('multiplies monthly cost by 12', () => {
    expect(calculateYearlyCost(dec(100), BillingCycle.MONTHLY)).toBeCloseTo(1200)
  })
})

describe('formatCurrency', () => {
  it('formats THB correctly', () => {
    const result = formatCurrency(100, 'THB')
    expect(result).toContain('100')
    expect(result).toContain('฿')
  })
  it('formats USD correctly', () => {
    const result = formatCurrency(9.99, 'USD')
    expect(result).toContain('9.99')
  })
  it('falls back gracefully for invalid currency code', () => {
    const result = formatCurrency(100, 'INVALID')
    expect(result).toBe('100.00 INVALID')
  })
})

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date()
    expect(daysUntil(today)).toBe(0)
  })
  it('returns 7 for 7 days from now', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(daysUntil(future)).toBe(7)
  })
  it('returns negative for past dates', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    expect(daysUntil(past)).toBe(-3)
  })
})

describe('isAlertingSoon', () => {
  it('returns true if within 7 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 5)
    expect(isAlertingSoon(soon)).toBe(true)
  })
  it('returns false if more than 7 days away', () => {
    const far = new Date()
    far.setDate(far.getDate() + 10)
    expect(isAlertingSoon(far)).toBe(false)
  })
  it('returns true on exactly day 7 (boundary)', () => {
    const boundary = new Date()
    boundary.setDate(boundary.getDate() + 7)
    expect(isAlertingSoon(boundary)).toBe(true)
  })
  it('returns true for today (day 0)', () => {
    expect(isAlertingSoon(new Date())).toBe(true)
  })
})

describe('isUpcoming', () => {
  it('returns true if within 30 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 20)
    expect(isUpcoming(soon)).toBe(true)
  })
  it('returns false if more than 30 days away', () => {
    const far = new Date()
    far.setDate(far.getDate() + 35)
    expect(isUpcoming(far)).toBe(false)
  })
  it('returns true on exactly day 30 (boundary)', () => {
    const boundary = new Date()
    boundary.setDate(boundary.getDate() + 30)
    expect(isUpcoming(boundary)).toBe(true)
  })
})

describe('groupTotalsByCurrency', () => {
  it('returns empty array for no subscriptions', () => {
    expect(groupTotalsByCurrency([])).toEqual([])
  })

  it('groups single currency correctly', () => {
    const subs = [
      { cost: dec(100), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
      { cost: dec(200), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
    ]
    const result = groupTotalsByCurrency(subs)
    expect(result).toHaveLength(1)
    expect(result[0].currency).toBe('THB')
    expect(result[0].monthlyTotal).toBeCloseTo(300)
    expect(result[0].yearlyTotal).toBeCloseTo(3600)
  })

  it('groups multiple currencies separately', () => {
    const subs = [
      { cost: dec(100), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
      { cost: dec(9.99), billingCycle: BillingCycle.MONTHLY, currency: 'USD' },
      { cost: dec(200), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
    ]
    const result = groupTotalsByCurrency(subs)
    expect(result).toHaveLength(2)

    const thb = result.find((r) => r.currency === 'THB')
    const usd = result.find((r) => r.currency === 'USD')
    expect(thb?.monthlyTotal).toBeCloseTo(300)
    expect(usd?.monthlyTotal).toBeCloseTo(9.99)
  })

  it('handles mixed billing cycles within same currency', () => {
    const subs = [
      { cost: dec(100), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
      { cost: dec(1200), billingCycle: BillingCycle.YEARLY, currency: 'THB' },
    ]
    const result = groupTotalsByCurrency(subs)
    expect(result).toHaveLength(1)
    expect(result[0].monthlyTotal).toBeCloseTo(200) // 100 + 1200/12
  })

  it('handles QUARTERLY billing cycle', () => {
    const subs = [
      { cost: dec(300), billingCycle: BillingCycle.QUARTERLY, currency: 'USD' },
    ]
    const result = groupTotalsByCurrency(subs)
    expect(result).toHaveLength(1)
    expect(result[0].currency).toBe('USD')
    expect(result[0].monthlyTotal).toBeCloseTo(100) // 300/3
    expect(result[0].yearlyTotal).toBeCloseTo(1200) // 100*12
  })

  it('groups 3+ different currencies separately', () => {
    const subs = [
      { cost: dec(1500), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
      { cost: dec(9.99), billingCycle: BillingCycle.MONTHLY, currency: 'USD' },
      { cost: dec(15), billingCycle: BillingCycle.MONTHLY, currency: 'EUR' },
    ]
    const result = groupTotalsByCurrency(subs)
    expect(result).toHaveLength(3)

    const thb = result.find((r) => r.currency === 'THB')
    const usd = result.find((r) => r.currency === 'USD')
    const eur = result.find((r) => r.currency === 'EUR')

    expect(thb?.monthlyTotal).toBeCloseTo(1500)
    expect(usd?.monthlyTotal).toBeCloseTo(9.99)
    expect(eur?.monthlyTotal).toBeCloseTo(15)
  })

  it('calculates correct yearlyTotal for multi-currency scenario', () => {
    const subs = [
      { cost: dec(500), billingCycle: BillingCycle.MONTHLY, currency: 'THB' },
      { cost: dec(1200), billingCycle: BillingCycle.YEARLY, currency: 'THB' },
      { cost: dec(10), billingCycle: BillingCycle.MONTHLY, currency: 'USD' },
      { cost: dec(60), billingCycle: BillingCycle.QUARTERLY, currency: 'EUR' },
    ]
    const result = groupTotalsByCurrency(subs)
    expect(result).toHaveLength(3)

    const thb = result.find((r) => r.currency === 'THB')
    const usd = result.find((r) => r.currency === 'USD')
    const eur = result.find((r) => r.currency === 'EUR')

    // THB: 500 (monthly) + 1200/12 (yearly→monthly) = 600/mo → 7200/yr
    expect(thb?.monthlyTotal).toBeCloseTo(600)
    expect(thb?.yearlyTotal).toBeCloseTo(7200)

    // USD: 10/mo → 120/yr
    expect(usd?.monthlyTotal).toBeCloseTo(10)
    expect(usd?.yearlyTotal).toBeCloseTo(120)

    // EUR: 60/3 (quarterly→monthly) = 20/mo → 240/yr
    expect(eur?.monthlyTotal).toBeCloseTo(20)
    expect(eur?.yearlyTotal).toBeCloseTo(240)
  })
})
