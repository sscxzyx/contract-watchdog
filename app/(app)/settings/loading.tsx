export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-[#1a1a1a] rounded-lg mb-8" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface border border-[#27272a] rounded-xl p-6 h-48" />
      ))}
    </div>
  )
}
