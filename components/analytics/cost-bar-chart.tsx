'use client'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { SubscriptionCostRank } from '@/lib/utils'

interface Props {
  data: SubscriptionCostRank[]
  currency: string
}

export function CostBarChart({ data, currency }: Props) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No active subscriptions</p>
  }

  // Gradient colors from teal to cyan
  const colors = ['#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc']

  return (
    <ResponsiveContainer width="100%" height={data.length * 48 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12 }}
          tickFormatter={(name: string) => {
            const item = data.find((d) => d.name === name)
            const label = `${item?.emoji ?? ''} ${name}`
            return label.length > 14 ? label.slice(0, 13) + '\u2026' : label
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          labelFormatter={(name) => {
            const item = data.find((d) => d.name === String(name))
            return `${item?.emoji ?? ''} ${String(name)}`
          }}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
        />
        <Bar dataKey="monthlyCost" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
