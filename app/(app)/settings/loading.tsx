export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-surface-2/60 rounded-lg mb-8" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface-2/40 p-6 h-48" />
      ))}
    </div>
  )
}
