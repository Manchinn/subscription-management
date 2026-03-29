'use client'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryFormData } from '@/lib/validations/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>
  initialData?: CategoryFormData
  pending: boolean
  onCancel?: () => void
}

export function CategoryForm({ onSubmit, initialData, pending, onCancel }: CategoryFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryFormData>,
    defaultValues: {
      name: initialData?.name ?? '',
      icon: initialData?.icon ?? '',
      color: initialData?.color ?? '#14b8a6',
    },
  })

  const colorValue = watch('color')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {/* Icon */}
          <div className="w-16 shrink-0">
            <Label htmlFor="cat-icon" className="text-xs text-muted-foreground">
              Icon
            </Label>
            <Input
              id="cat-icon"
              {...register('icon')}
              placeholder="📦"
              className="mt-1 text-center text-lg"
              maxLength={10}
            />
            {errors.icon && <p className="mt-0.5 text-[10px] text-destructive">{errors.icon.message}</p>}
          </div>

          {/* Name */}
          <div className="flex-1">
            <Label htmlFor="cat-name" className="text-xs text-muted-foreground">
              Name
            </Label>
            <Input
              id="cat-name"
              {...register('name')}
              placeholder="Category name"
              className="mt-1 text-sm font-medium"
              maxLength={50}
            />
            {errors.name && <p className="mt-0.5 text-[10px] text-destructive">{errors.name.message}</p>}
          </div>

          {/* Color */}
          <div className="w-16 shrink-0">
            <Label htmlFor="cat-color" className="text-xs text-muted-foreground">
              Color
            </Label>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="color"
                value={colorValue}
                onChange={(e) => setValue('color', e.target.value)}
                className="h-8 w-8 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
            </div>
            {errors.color && <p className="mt-0.5 text-[10px] text-destructive">{errors.color.message}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            className="rounded-xl hover:shadow-md active:scale-[0.98] transition-transform"
          >
            {pending ? 'Saving...' : initialData ? 'Save' : 'Add'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={pending}
              className="rounded-xl"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
