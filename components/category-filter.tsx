'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: { id: string; slug: string; name: string; icon: string; color: string }[]
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
      {tabs.map((cat) => {
        const isActive = current === cat.slug
        const isAll = cat.slug === 'all'
        const catColor = 'color' in cat ? (cat as { color: string }).color : undefined

        return (
          <button
            type="button"
            key={cat.slug}
            onClick={() => select(cat.slug)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200',
              isActive
                ? isAll
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'text-white font-semibold shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
            style={
              isActive && !isAll && catColor
                ? { backgroundColor: catColor }
                : undefined
            }
          >
            {cat.icon} {cat.name}
          </button>
        )
      })}
    </div>
  )
}
