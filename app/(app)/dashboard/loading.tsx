export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-surface-2/60 rounded-lg" />

      {/* Health + alert cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface-2/40 p-6 h-40" />
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-2/40 p-5 h-28" />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-5 h-24" />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface-2/40 p-5 h-56" />
        <div className="rounded-xl border border-border bg-surface-2/40 p-5 h-56" />
      </div>
    </div>
  )
}
