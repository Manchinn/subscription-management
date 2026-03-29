export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="mt-1.5 h-3 w-48 rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {/* Profile card skeleton */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
          <div className="h-3 w-12 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-10 rounded bg-muted" />
            <div className="h-9 rounded bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-9 rounded bg-muted" />
          </div>
          <div className="h-8 w-14 rounded-xl bg-muted" />
        </div>
        {/* Password card skeleton */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="h-9 rounded bg-muted" />
          <div className="h-9 rounded bg-muted" />
          <div className="h-8 w-28 rounded-xl bg-muted" />
        </div>
        {/* Sign out skeleton */}
        <div className="h-11 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
