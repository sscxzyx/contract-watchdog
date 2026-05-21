export default function ContractDetailLoading() {
  return (
    <div className="max-w-6xl animate-pulse">
      <div className="h-4 w-24 bg-[#1a1a1a] rounded mb-6" />

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex-1 space-y-2">
          <div className="h-8 w-80 bg-[#1a1a1a] rounded-lg" />
          <div className="h-4 w-48 bg-[#1a1a1a] rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-[#1a1a1a] rounded-lg" />
          <div className="h-9 w-20 bg-[#1a1a1a] rounded-lg" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-[#27272a] rounded-xl p-5 h-24" />
        ))}
      </div>

      {/* Main columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface border border-[#27272a] rounded-xl p-5 h-32" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="bg-surface border border-[#27272a] rounded-xl h-96" />
        </div>
      </div>
    </div>
  )
}
