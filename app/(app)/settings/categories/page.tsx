import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CategoryManager } from '@/components/category-manager'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Categories | Subscription Tracker',
}

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId: session.user.id }] },
    orderBy: [{ userId: 'asc' }, { name: 'asc' }],
  })

  const globalCategories = categories.filter((c) => c.userId === null)
  const userCategories = categories.filter((c) => c.userId !== null)

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <Link
          href="/settings"
          className="rounded-xl bg-muted p-2 transition-colors hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Categories</h2>
          <p className="text-xs text-muted-foreground">Manage subscription categories</p>
        </div>
      </div>
      <CategoryManager
        globalCategories={globalCategories}
        userCategories={userCategories}
      />
    </div>
  )
}
