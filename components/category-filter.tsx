'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: { id: string; slug: string; name: string; icon: string }[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  function select(slug: string) {
    const params = new URLSearchParams(searchParams)
    if (slug === 'all') params.delete('category')
    else params.set('category', slug)
    router.push(`${pathname}?${params.toString()}`)
  }

  const tabs = [{ id: 'system-all', slug: 'all', name: 'All', icon: '🔍' }, ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
      {tabs.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => select(cat.slug)}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            current === cat.slug
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground'
          )}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  )
}
