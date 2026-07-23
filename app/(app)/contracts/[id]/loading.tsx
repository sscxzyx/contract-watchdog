export default function ContractDetailLoading() {
  return (
    <div className="max-w-6xl animate-pulse">
      <div className="h-4 w-24 bg-surface-2/60 rounded mb-6" />

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex-1 space-y-2">
          <div className="h-8 w-80 bg-surface-2/60 rounded-lg" />
          <div className="h-4 w-48 bg-surface-2/60 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-surface-2/60 rounded-lg" />
          <div className="h-9 w-20 bg-surface-2/60 rounded-lg" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface-2/40 p-5 h-24" />
        ))}
      </div>

      {/* Main columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-2/40 p-5 h-32" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface-2/40 h-96" />
        </div>
      </div>
    </div>
  )
}
