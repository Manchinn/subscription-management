export default function SubscriptionsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Category filter skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 shrink-0 rounded-full bg-muted" />
        ))}
      </div>

      {/* Subscription cards skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
