export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-3 h-6 w-24 rounded bg-muted" />
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-3 h-6 w-24 rounded bg-muted" />
        </div>
      </div>

      {/* Alert strip skeleton */}
      <div className="h-12 rounded-2xl bg-muted" />

      {/* Upcoming list skeleton */}
      <div>
        <div className="mb-3 h-3 w-28 rounded bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
