import { BottomNav } from '@/components/bottom-nav'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen pb-16">
        <header className="sticky top-0 z-40 border-b bg-background px-4 py-3">
          <h1 className="text-lg font-semibold">Subscription Tracker</h1>
        </header>
        <main className="mx-auto max-w-md px-4 py-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </SessionProvider>
  )
}
