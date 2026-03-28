'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Home',          icon: Home },
  { href: '/subscriptions', label: 'Subscriptions', icon: List },
  { href: '/settings',      label: 'Settings',      icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
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
                'flex flex-col items-center gap-0.5 px-4 py-2 text-xs',
                active ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
