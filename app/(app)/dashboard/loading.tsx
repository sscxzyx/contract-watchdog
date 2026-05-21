export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg" />

      {/* Health + alert cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-[#27272a] rounded-xl p-6 h-40" />
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-[#27272a] rounded-xl p-5 h-28" />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface border border-[#27272a] rounded-xl p-5 h-24" />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-[#27272a] rounded-xl p-5 h-56" />
        <div className="bg-surface border border-[#27272a] rounded-xl p-5 h-56" />
      </div>
    </div>
  )
}
