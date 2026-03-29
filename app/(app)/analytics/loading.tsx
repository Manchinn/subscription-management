export default function AnalyticsLoading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
        <div className="mt-1 h-3 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Donut chart skeleton */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 h-3 w-36 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center justify-center py-8">
          <div className="h-[170px] w-[170px] animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-3 flex justify-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </section>

      {/* Billing cycle skeleton */}
      <section>
        <div className="mb-3 h-3 w-24 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="mx-auto h-5 w-5 animate-pulse rounded bg-muted" />
              <div className="mx-auto mt-2 h-3 w-14 animate-pulse rounded-md bg-muted" />
              <div className="mx-auto mt-2 h-6 w-8 animate-pulse rounded-md bg-muted" />
              <div className="mx-auto mt-1 h-3 w-16 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* Bar chart skeleton */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 h-3 w-32 animate-pulse rounded-md bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
              <div
                className="h-7 animate-pulse rounded-r-md bg-muted"
                style={{ width: `${100 - i * 15}%` }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
