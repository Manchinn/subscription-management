import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyCost,
  calculateYearlyCost,
  formatCurrency,
  daysUntil,
  isAlertingSoon,
  isUpcoming,
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
