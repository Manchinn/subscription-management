'use client'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { subscriptionSchema, createSubscription, updateSubscription, deleteSubscription } from '@/lib/actions/subscription.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { BillingCycle, Status } from '@prisma/client'
import type { Category } from '@prisma/client'
import { format } from 'date-fns'
import { useTransition } from 'react'

type FormData = z.infer<typeof subscriptionSchema>

interface SubscriptionFormProps {
  categories: Category[]
  defaultCategoryId: string
  defaultCurrency: string
  initialData?: Partial<FormData> & { id?: string }
}

export function SubscriptionForm({
  categories,
  defaultCategoryId,
  defaultCurrency,
  initialData,
}: SubscriptionFormProps) {
  const isEdit = !!initialData?.id
  const [pending, startTransition] = useTransition()

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
    startTransition(async () => {
      if (isEdit && initialData?.id) {
        await updateSubscription(initialData.id, data)
      } else {
        await createSubscription(data)
      }
    })
  }

  function handleDelete() {
    if (!initialData?.id || !confirm('Delete this subscription?')) return
    startTransition(async () => {
      await deleteSubscription(initialData.id!)
    })
  }

  const nextBillingDate = watch('nextBillingDate')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} placeholder="Netflix" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cost">Cost *</Label>
          <Input id="cost" type="number" step="0.01" {...register('cost')} placeholder="0.00" />
          {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Input {...register('currency')} placeholder="THB" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Billing Cycle *</Label>
        <Select
          defaultValue={watch('billingCycle')}
          onValueChange={(v) => { if (v) setValue('billingCycle', v as BillingCycle) }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="nextBillingDate">Next Billing Date *</Label>
        <Input
          id="nextBillingDate"
          type="date"
          value={nextBillingDate ? format(new Date(nextBillingDate), 'yyyy-MM-dd') : ''}
          onChange={(e) => setValue('nextBillingDate', new Date(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <Label>Category</Label>
        <Select
          defaultValue={watch('categoryId')}
          onValueChange={(v) => { if (v) setValue('categoryId', v) }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Input id="paymentMethod" {...register('paymentMethod')} placeholder="Credit Card" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" {...register('logoUrl')} placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="logoEmoji">Emoji</Label>
          <Input id="logoEmoji" {...register('logoEmoji')} placeholder="🎬" />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            defaultValue={watch('status')}
            onValueChange={(v) => { if (v) setValue('status', v as Status) }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Subscription'}
        </Button>
        {isEdit && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
