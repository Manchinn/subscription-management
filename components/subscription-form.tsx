'use client'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSubscription, updateSubscription, deleteSubscription } from '@/lib/actions/subscription.actions'
import { subscriptionSchema } from '@/lib/validations/subscription'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BillingCycle, Status } from '@prisma/client'
import type { Category } from '@prisma/client'
import { format } from 'date-fns'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

type FormData = z.infer<typeof subscriptionSchema>

interface SubscriptionFormProps {
  categories: Category[]
  defaultCategoryId: string
  defaultCurrency: string
  initialData?: Partial<FormData> & { id?: string }
}

const BILLING_OPTIONS: { value: BillingCycle; label: string; sub: string }[] = [
  { value: BillingCycle.MONTHLY, label: 'Monthly', sub: '/mo' },
  { value: BillingCycle.QUARTERLY, label: 'Quarterly', sub: '/3mo' },
  { value: BillingCycle.YEARLY, label: 'Yearly', sub: '/yr' },
]

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; ring: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-600' },
  PAUSED: { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-500' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-100', ring: 'ring-gray-400' },
}

export function SubscriptionForm({
  categories,
  defaultCategoryId,
  defaultCurrency,
  initialData,
}: SubscriptionFormProps) {
  const isEdit = !!initialData?.id
  const [pending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(subscriptionSchema) as Resolver<FormData>,
    defaultValues: {
      currency: defaultCurrency,
      billingCycle: BillingCycle.MONTHLY,
      status: Status.ACTIVE,
      categoryId: defaultCategoryId,
      ...initialData,
      nextBillingDate: initialData?.nextBillingDate
        ? new Date(initialData.nextBillingDate)
        : new Date(),
    },
  })

  function onSubmit(data: FormData) {
    setActionError(null)
    startTransition(async () => {
      const result = isEdit && initialData?.id
        ? await updateSubscription(initialData.id, data)
        : await createSubscription(data)
      if (result && !result.success) {
        setActionError(result.error ?? 'Something went wrong')
      }
    })
  }

  function handleDelete() {
    if (!initialData?.id || !confirm('Delete this subscription?')) return
    setActionError(null)
    startTransition(async () => {
      const result = await deleteSubscription(initialData.id!)
      if (result && !result.success) {
        setActionError(result.error ?? 'Something went wrong')
      }
    })
  }

  const nextBillingDate = watch('nextBillingDate')
  const currentCycle = watch('billingCycle')
  const currentStatus = watch('status')
  const currentCategory = watch('categoryId')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name — hero field */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Service Name
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g. Netflix, Spotify, iCloud+"
          className="mt-2 border-0 bg-transparent px-0 text-lg font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0"
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Cost + Currency — teal accent */}
      <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-cyan-50/50 p-4 shadow-sm">
          <Label className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">
            Amount
          </Label>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="flex-1">
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost')}
                placeholder="0.00"
                className="hide-arrows border-0 bg-white/60 px-3 text-2xl font-bold tabular-nums text-teal-900 placeholder:text-teal-300 focus-visible:ring-teal-400"
              />
            </div>
            <div className="w-20">
              <Input
                {...register('currency')}
                placeholder="THB"
                maxLength={3}
                className="border-0 bg-white/60 text-center text-sm font-semibold uppercase text-teal-700 placeholder:text-teal-300 focus-visible:ring-teal-400"
              />
            </div>
          </div>
          {errors.cost && <p className="mt-1 text-xs text-destructive">{errors.cost.message}</p>}
      </div>

      {/* Billing cycle — segmented control + date inline */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billing Cycle
            </Label>
            <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-muted p-1">
              {BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('billingCycle', opt.value)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-center transition-all duration-200',
                    currentCycle === opt.value
                      ? 'bg-white font-semibold text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="block text-sm">{opt.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="nextBillingDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Billing Date
            </Label>
            <Input
              id="nextBillingDate"
              type="date"
              value={nextBillingDate ? format(new Date(nextBillingDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => setValue('nextBillingDate', new Date(e.target.value))}
              className="mt-2 tabular-nums"
            />
          </div>
      </div>

      {/* Category — emoji pills */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = currentCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue('categoryId', cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200',
                    isSelected
                      ? 'font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  style={isSelected ? { backgroundColor: cat.color } : undefined}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>
      </div>

      {/* Status — edit mode only */}
      {isEdit && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </Label>
            <div className="mt-3 flex gap-2">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([value, config]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('status', value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    currentStatus === value
                      ? `${config.bg} ${config.color} ring-2 ${config.ring}`
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
        </div>
      )}

      {/* Error */}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{actionError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          className="flex-1 rounded-xl py-6 text-base font-semibold shadow-md transition-transform active:scale-[0.98]"
          disabled={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <svg className="spinner h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              Saving…
            </span>
          ) : isEdit ? 'Save Changes' : 'Add Subscription'}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-xl border-red-200 px-6 py-6 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
