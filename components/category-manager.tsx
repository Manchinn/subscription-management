'use client'
import { useState, useTransition } from 'react'
import type { Category } from '@prisma/client'
import type { CategoryFormData } from '@/lib/validations/category'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/category.actions'
import { CategoryForm } from '@/components/category-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface CategoryManagerProps {
  globalCategories: Category[]
  userCategories: Category[]
}

export function CategoryManager({ globalCategories, userCategories }: CategoryManagerProps) {
  const [addMode, setAddMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreate(data: CategoryFormData) {
    return new Promise<void>((resolve) => {
      setError(null)
      startTransition(async () => {
        const result = await createCategory(data)
        if (!result.success) {
          setError(result.error ?? 'Something went wrong')
        } else {
          setAddMode(false)
        }
        resolve()
      })
    })
  }

  function handleUpdate(id: string, data: CategoryFormData) {
    return new Promise<void>((resolve) => {
      setError(null)
      startTransition(async () => {
        const result = await updateCategory(id, data)
        if (!result.success) {
          setError(result.error ?? 'Something went wrong')
        } else {
          setEditingId(null)
        }
        resolve()
      })
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id)
      if (!result.success) {
        setError(result.error ?? 'Something went wrong')
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-5">
      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Add button */}
      {!addMode && (
        <Button
          onClick={() => { setAddMode(true); setEditingId(null); setError(null) }}
          size="sm"
          className="rounded-xl hover:shadow-md active:scale-[0.98] transition-transform"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      )}

      {/* Add form */}
      {addMode && (
        <CategoryForm
          onSubmit={handleCreate}
          pending={pending}
          onCancel={() => { setAddMode(false); setError(null) }}
        />
      )}

      {/* User categories */}
      {userCategories.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Categories ({userCategories.length})
          </p>
          <div className="space-y-2">
            {userCategories.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingId(editingId === cat.id ? null : cat.id)
                        setAddMode(false)
                        setError(null)
                      }}
                      disabled={pending}
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { setDeleteTarget(cat); setError(null) }}
                      disabled={pending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Inline edit form */}
                {editingId === cat.id && (
                  <div className="mt-2">
                    <CategoryForm
                      initialData={{
                        name: cat.name,
                        icon: cat.icon,
                        color: cat.color,
                      }}
                      onSubmit={(data) => handleUpdate(cat.id, data)}
                      pending={pending}
                      onCancel={() => { setEditingId(null); setError(null) }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global (default) categories */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Default Categories ({globalCategories.length})
        </p>
        <div className="space-y-2">
          {globalCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.name}</span>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Default
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
