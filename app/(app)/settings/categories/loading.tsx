export default function CategoriesLoading() {
  return (
    <div className="animate-pulse space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      </div>

      {/* Add button skeleton */}
      <div className="h-7 w-28 rounded-xl bg-muted" />

      {/* User categories skeleton */}
      <div>
        <div className="mb-3 h-3 w-32 rounded bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-muted" />
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-3 w-3 rounded-full bg-muted" />
              </div>
              <div className="flex gap-1">
                <div className="h-7 w-7 rounded bg-muted" />
                <div className="h-7 w-7 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default categories skeleton */}
      <div>
        <div className="mb-3 h-3 w-36 rounded bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-muted" />
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-3 w-3 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-12 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
