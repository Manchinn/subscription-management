'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Home',          icon: Home },
  { href: '/subscriptions', label: 'Subscriptions', icon: List },
  { href: '/analytics',     label: 'Analytics',     icon: BarChart3 },
  { href: '/settings',      label: 'Settings',      icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard'
            ? pathname === href
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-4 py-2 transition-colors duration-200',
                active ? 'text-teal-600' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-teal-600" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
