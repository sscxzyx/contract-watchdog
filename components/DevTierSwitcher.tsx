'use client'

import { useState } from 'react'
import { FlaskConical, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const TIERS = [
  { id: 'free', label: 'Free' },
  { id: 'starter', label: 'Starter' },
  { id: 'business', label: 'Business' },
  { id: 'agency', label: 'Agency' },
] as const

// Floating dev-only panel for previewing the app at each plan tier.
// Rendered only for the dev preview account (checked server-side in the layout).
export default function DevTierSwitcher({ currentTier }: { currentTier: string }) {
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  async function switchTier(tier: string) {
    if (tier === currentTier || switching) return
    setSwitching(tier)
    setError(false)
    try {
      const res = await fetch('/api/dev/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      if (!res.ok) throw new Error()
      // Full reload so every tier-dependent surface (sidebar plan card,
      // vault gate, dashboard banner) picks up the new tier.
      window.location.reload()
    } catch {
      setError(true)
      setSwitching(null)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-primary/30 bg-[#0e0e10]/95 backdrop-blur shadow-card overflow-hidden w-48">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className="size-6 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
          <FlaskConical className="w-3 h-3 text-primary" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Dev · tier preview
        </span>
        {collapsed
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-1">
          {TIERS.map(t => {
            const active = t.id === currentTier
            return (
              <button
                key={t.id}
                onClick={() => switchTier(t.id)}
                disabled={switching !== null}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs border transition-all disabled:opacity-60 ${
                  active
                    ? 'bg-primary/15 text-primary border-primary/30 shadow-glow-soft'
                    : 'text-muted-foreground border-transparent hover:bg-white/[0.03] hover:text-foreground'
                }`}
              >
                {t.label}
                {switching === t.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : active ? (
                  <span className="size-1.5 rounded-full bg-primary animate-breathe" />
                ) : null}
              </button>
            )
          })}
          {error && (
            <p className="text-[10px] text-danger pt-1">Switch failed — try again</p>
          )}
        </div>
      )}
    </div>
  )
}
