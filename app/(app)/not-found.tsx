import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function AppNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl">🔍</div>
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been removed.
      </p>
      <Link href="/dashboard" className={buttonVariants({ className: 'rounded-xl' })}>
        Back to Dashboard
      </Link>
    </div>
  )
}
