import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, FileText, Upload,
  TrendingUp, Shield, Activity, ChevronRight,
  User, Zap, ShieldAlert, Calendar,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function daysFromToday(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function greeting() {
  const hour = Number(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', hour: 'numeric', hour12: false }))
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function healthColor(score: number) {
  if (score >= 80) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-danger'
}

function healthLabel(score: number) {
  if (score >= 80) return 'Healthy'
  if (score >= 50) return 'Moderate Risk'
  return 'High Risk'
}

function markerColor(days: number) {
  if (days < 14) return 'bg-danger'
  if (days < 30) return 'bg-warning'
  return 'bg-success'
}

function markerBorder(days: number) {
  if (days < 14) return 'border-danger/50'
  if (days < 30) return 'border-warning/50'
  return 'border-success/50'
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-success/15 text-success',
  expiring_soon: 'bg-warning/15 text-warning',
  expired: 'bg-danger/15 text-danger',
  needs_review: 'bg-secondary/15 text-secondary',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  needs_review: 'Needs Review',
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const in90Days = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

  const [
    { data: contracts },
    { data: timelineEvents },
    { data: recentContracts },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, contract_name, status, risk_level, health_score, end_date, created_at'),
    supabase
      .from('contract_events')
      .select('id, contract_id, event_date, event_label, contracts(id, contract_name)')
      .gte('event_date', today)
      .lte('event_date', in90Days)
      .order('event_date', { ascending: true }),
    supabase
      .from('contracts')
      .select('id, contract_name, counterparty_name, status, risk_level, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('users')
      .select('onboarding_complete, full_name, industry, plan_tier')
      .eq('id', user.id)
      .single(),
  ])

  const allContracts = contracts ?? []
  const events = timelineEvents ?? []
  const recent = recentContracts ?? []

  // ── empty state ────────────────────────────────────────────────────────────
  if (allContracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-glow-soft">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to Controva</h1>
        <p className="text-muted-foreground text-sm max-w-sm mb-8">
          Upload your first contract and let AI analyse it for risks, key dates, and obligations — in under 30 seconds.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:bg-primary/90 hover:scale-[1.02] transition-all shine"
        >
          <Upload className="w-4 h-4" />
          Upload your first contract
        </Link>
      </div>
    )
  }

  // ── metrics ────────────────────────────────────────────────────────────────
  const withHealth = allContracts.filter(c => c.health_score !== null)
  const avgHealth = withHealth.length
    ? withHealth.reduce((s, c) => s + c.health_score, 0) / withHealth.length
    : null

  const expiringSoonPenalty = allContracts.filter(c => c.status === 'expiring_soon').length * 5
  const expiredPenalty = allContracts.filter(c => c.status === 'expired').length * 10
  const portfolioScore = avgHealth !== null
    ? Math.max(0, Math.min(100, Math.round(avgHealth - Math.min(expiringSoonPenalty, 20) - Math.min(expiredPenalty, 20))))
    : null

  const expiringIn30 = allContracts.filter(
    c => c.end_date && c.end_date >= today && c.end_date <= in30Days
  ).length

  const highRiskCount = allContracts.filter(c => c.risk_level === 'high').length
  const needsReviewCount = allContracts.filter(c => c.status === 'needs_review').length

  const upcomingDeadlines = events.slice(0, 5)

  const gaugeR = 32
  const gaugeC = 2 * Math.PI * gaugeR

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Free tier upgrade banner */}
      {profile?.plan_tier === 'free' && (
        <div className="relative overflow-hidden flex items-center justify-between gap-4 px-4 py-3 bg-gold/[0.06] border border-gold/20 rounded-xl">
          <span className="absolute -top-8 -right-8 size-24 rounded-full bg-gold/10 blur-2xl animate-breathe" />
          <div className="relative flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">You&apos;re on the Free plan</p>
              <p className="text-muted-foreground text-xs">Upgrade to unlock Vault, full alerts, and up to 15 contracts</p>
            </div>
          </div>
          <Link
            href="/settings#billing"
            className="relative shrink-0 text-xs text-gold hover:text-gold/80 font-semibold transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            Upgrade now <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Complete profile banner */}
      {profile && !profile.onboarding_complete && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-primary/[0.06] border border-primary/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Complete your profile</p>
              <p className="text-muted-foreground text-xs">Personalise AI analysis for your industry and business type</p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 text-xs text-primary hover:text-secondary font-semibold transition-colors flex items-center gap-1"
          >
            Complete setup <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground">Portfolio overview</p>
        <h1 className="text-2xl font-semibold text-foreground mt-0.5">
          {profile?.full_name ? `${greeting()}, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {profile?.industry
            ? `${allContracts.length} contract${allContracts.length !== 1 ? 's' : ''} · ${profile.industry}`
            : `${allContracts.length} contract${allContracts.length !== 1 ? 's' : ''} in your portfolio`}
        </p>
      </div>

      {/* Top row: health score + alert cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Portfolio health score — gradient radial gauge, same as the site mockup */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-surface-2/40 p-6 flex flex-col items-center justify-center text-center">
          {portfolioScore !== null ? (
            <>
              <div className="relative size-24 mb-3">
                <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
                  <circle cx="40" cy="40" r={gaugeR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r={gaugeR}
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={gaugeC}
                    strokeDashoffset={gaugeC - (portfolioScore / 100) * gaugeC}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(74,222,128,0.6))' }}
                  />
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4ADE80" />
                      <stop offset="100%" stopColor="#22C55E" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">{portfolioScore}</span>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Portfolio health score</p>
              <p className={`text-xs mt-1 inline-flex items-center gap-1 ${healthColor(portfolioScore)}`}>
                <TrendingUp className="w-3 h-3" /> {healthLabel(portfolioScore)}
              </p>
            </>
          ) : (
            <>
              <Activity className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-foreground text-sm font-medium">Portfolio Health</p>
              <p className="text-xs text-muted-foreground mt-0.5">Analysing contracts…</p>
            </>
          )}
        </div>

        {/* Alert stat cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/vault?filter=expiring_soon"
            className="relative overflow-hidden rounded-xl border border-border bg-surface-2/40 hover:border-warning/30 hover:-translate-y-0.5 p-5 transition-all group"
          >
            {expiringIn30 > 0 && (
              <span className="absolute -top-6 -right-6 size-16 rounded-full bg-warning/10 blur-2xl animate-breathe" />
            )}
            <div className="relative flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Expiring soon</span>
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <p className="relative text-2xl font-semibold tracking-tight text-foreground">{expiringIn30}</p>
            <p className="relative text-xs text-muted-foreground mt-1 flex items-center justify-between">
              contract{expiringIn30 !== 1 ? 's' : ''} in 30 days
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </p>
          </Link>

          <Link
            href="/vault?filter=high_risk"
            className="relative overflow-hidden rounded-xl border border-border bg-surface-2/40 hover:border-danger/30 hover:-translate-y-0.5 p-5 transition-all group"
          >
            {highRiskCount > 0 && (
              <span className="absolute -top-6 -right-6 size-16 rounded-full bg-danger/10 blur-2xl animate-breathe" />
            )}
            <div className="relative flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">High risk</span>
              <ShieldAlert className="w-4 h-4 text-danger" />
            </div>
            <p className="relative text-2xl font-semibold tracking-tight text-foreground">{highRiskCount}</p>
            <p className="relative text-xs text-muted-foreground mt-1 flex items-center justify-between">
              clause{highRiskCount !== 1 ? 's' : ''} detected
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </p>
          </Link>

          <Link
            href="/vault?filter=needs_review"
            className="rounded-xl border border-border bg-surface-2/40 hover:border-primary/30 hover:-translate-y-0.5 p-5 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Needs review</span>
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{needsReviewCount}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              contract{needsReviewCount !== 1 ? 's' : ''} requiring action
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </p>
          </Link>
        </div>
      </div>

      {/* Deadline timeline strip */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Next 90 days
          </p>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger inline-block" /> Under 14 days</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> 14–30 days</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success inline-block" /> 30–90 days</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="h-14 flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground/60">No upcoming events in the next 90 days</p>
          </div>
        ) : (
          <div className="relative h-14">
            {/* Track */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px bg-gradient-to-r from-primary/40 via-border to-border rounded-full" />
            {/* 30-day mark */}
            <div className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: '33.33%' }}>
              <div className="h-full w-px bg-border/60" />
            </div>
            {/* Labels */}
            <div className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground/60">Today</div>
            <div className="absolute -bottom-5 text-[10px] text-muted-foreground/60 -translate-x-1/2" style={{ left: '33.33%' }}>30d</div>
            <div className="absolute -bottom-5 right-0 text-[10px] text-muted-foreground/60">90d</div>

            {/* Markers */}
            {events.map(ev => {
              const days = daysFromToday(ev.event_date)
              const pct = Math.min(Math.max((days / 90) * 100, 0), 99)
              const contractName = (ev.contracts as { contract_name?: string } | null)?.contract_name ?? 'Contract'
              return (
                <Link
                  key={ev.id}
                  href={`/contracts/${ev.contract_id}`}
                  style={{ left: `${pct}%` }}
                  title={`${contractName} — ${ev.event_label} (${days}d)`}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${markerColor(days)} ${markerBorder(days)} ${days < 14 ? 'shadow-glow-soft' : ''} hover:scale-150 transition-transform cursor-pointer z-10`}
                />
              )
            })}
          </div>
        )}
        {/* bottom spacer for labels */}
        {events.length > 0 && <div className="h-5" />}
      </div>

      {/* Bottom row: upcoming deadlines + recent contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming deadlines — timeline rail, same as the site's alerts view */}
        <div className="rounded-xl border border-border bg-surface-2/40 p-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Upcoming deadlines</p>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-6">No upcoming deadlines</p>
          ) : (
            <div className="relative pl-4">
              {/* vertical timeline rail */}
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />

              <div className="space-y-2">
                {upcomingDeadlines.map((ev, i) => {
                  const days = daysFromToday(ev.event_date)
                  const contractName = (ev.contracts as { id?: string; contract_name?: string } | null)?.contract_name ?? 'Contract'
                  const tone = days < 14
                    ? { node: 'bg-danger border-danger/40', chip: 'bg-danger/15 text-danger', border: 'border-danger/25 bg-danger/[0.04]' }
                    : days < 30
                    ? { node: 'bg-warning border-warning/40', chip: 'bg-warning/15 text-warning', border: 'border-warning/25 bg-warning/[0.04]' }
                    : { node: 'bg-primary border-primary/40', chip: 'bg-primary/15 text-primary', border: 'border-primary/20 bg-primary/[0.03]' }
                  return (
                    <div key={ev.id} className="relative">
                      <div className={`absolute -left-[13px] top-3 size-3 rounded-full border-2 ${tone.node} ${i === 0 ? 'shadow-glow-soft' : ''}`}>
                        {i === 0 && days < 14 && (
                          <span className="absolute inset-0 rounded-full border-2 border-danger/60 pulse-ring text-danger" />
                        )}
                      </div>
                      <Link
                        href={`/contracts/${ev.contract_id}`}
                        className={`flex items-center justify-between gap-2 rounded-md border ${tone.border} p-2.5 hover:brightness-125 transition-all group`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{contractName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.event_label} · {formatDate(ev.event_date)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded tabular-nums ${tone.chip}`}>{days}d</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent contracts */}
        <div className="rounded-xl border border-border bg-surface-2/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent contracts</p>
            <Link href="/vault" className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <span className="size-1 rounded-full bg-primary animate-breathe" />
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-6">No contracts yet</p>
          ) : (
            <div className="space-y-1">
              {recent.map(c => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-2 border border-transparent hover:bg-primary/[0.06] hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{c.contract_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.counterparty_name ?? 'Unknown counterparty'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[c.status] ?? 'bg-surface-2 text-muted-foreground'}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
