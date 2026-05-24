import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  AlertTriangle, Clock, FileText, Upload,
  TrendingUp, Shield, Activity, ChevronRight,
  Calendar, User,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function daysFromToday(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function healthColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function healthRingColor(score: number) {
  if (score >= 80) return '#4ade80'
  if (score >= 50) return '#fbbf24'
  return '#f87171'
}

function healthLabel(score: number) {
  if (score >= 80) return 'Healthy'
  if (score >= 50) return 'Moderate Risk'
  return 'High Risk'
}

function markerColor(days: number) {
  if (days < 14) return 'bg-red-400'
  if (days < 30) return 'bg-amber-400'
  return 'bg-green-400'
}

function markerBorder(days: number) {
  if (days < 14) return 'border-red-400/50'
  if (days < 30) return 'border-amber-400/50'
  return 'border-green-400/50'
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-400/10 text-green-400',
  expiring_soon: 'bg-amber-400/10 text-amber-400',
  expired: 'bg-red-400/10 text-red-400',
  needs_review: 'bg-purple-400/10 text-purple-400',
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
      .eq('id', user!.id)
      .single(),
  ])

  const allContracts = contracts ?? []
  const events = timelineEvents ?? []
  const recent = recentContracts ?? []

  // ── empty state ────────────────────────────────────────────────────────────
  if (allContracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome to Controva</h1>
        <p className="text-[#a1a1aa] text-sm max-w-sm mb-8">
          Upload your first contract and let AI analyse it for risks, key dates, and obligations — in under 30 seconds.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Complete profile banner */}
      {profile && !profile.onboarding_complete && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Complete your profile</p>
              <p className="text-[#a1a1aa] text-xs">Personalise AI analysis for your industry and business type</p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 text-xs text-accent hover:text-accent-hover font-semibold transition-colors flex items-center gap-1"
          >
            Complete setup <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-[#a1a1aa] mt-1 text-sm">
          {profile?.industry
            ? `${allContracts.length} contract${allContracts.length !== 1 ? 's' : ''} · ${profile.industry}`
            : `${allContracts.length} contract${allContracts.length !== 1 ? 's' : ''} in your portfolio`}
        </p>
      </div>

      {/* Top row: health score + alert cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Portfolio health score */}
        <div className="lg:col-span-1 bg-surface border border-[#27272a] rounded-xl p-6 flex flex-col items-center justify-center text-center">
          {portfolioScore !== null ? (
            <>
              <div className="relative w-24 h-24 mb-3">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="40" fill="none"
                    stroke={healthRingColor(portfolioScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - portfolioScore / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${healthColor(portfolioScore)}`}>
                    {portfolioScore}
                  </span>
                </div>
              </div>
              <p className="text-white text-sm font-medium">Portfolio Health</p>
              <p className={`text-xs mt-0.5 ${healthColor(portfolioScore)}`}>
                {healthLabel(portfolioScore)}
              </p>
            </>
          ) : (
            <>
              <Activity className="w-8 h-8 text-[#a1a1aa] mb-3" />
              <p className="text-white text-sm font-medium">Portfolio Health</p>
              <p className="text-xs text-[#a1a1aa] mt-0.5">Analysing contracts…</p>
            </>
          )}
        </div>

        {/* Alert cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/vault?filter=expiring_soon"
            className="bg-surface border border-[#27272a] hover:border-amber-400/30 rounded-xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-white">{expiringIn30}</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              contract{expiringIn30 !== 1 ? 's' : ''} expiring in 30 days
            </p>
          </Link>

          <Link
            href="/vault?filter=high_risk"
            className="bg-surface border border-[#27272a] hover:border-red-400/30 rounded-xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-white">{highRiskCount}</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              high-risk clause{highRiskCount !== 1 ? 's' : ''} detected
            </p>
          </Link>

          <Link
            href="/vault?filter=needs_review"
            className="bg-surface border border-[#27272a] hover:border-purple-400/30 rounded-xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-white">{needsReviewCount}</p>
            <p className="text-xs text-[#a1a1aa] mt-1">
              contract{needsReviewCount !== 1 ? 's' : ''} requiring action
            </p>
          </Link>
        </div>
      </div>

      {/* Deadline timeline strip */}
      <div className="bg-surface border border-[#27272a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#a1a1aa]" />
            Next 90 Days
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#a1a1aa]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Under 14 days</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 14–30 days</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> 30–90 days</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="h-14 flex items-center justify-center border border-dashed border-[#27272a] rounded-lg">
            <p className="text-xs text-[#52525b]">No upcoming events in the next 90 days</p>
          </div>
        ) : (
          <div className="relative h-14">
            {/* Track */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-[#27272a] rounded-full" />
            {/* 30-day mark */}
            <div className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: '33.33%' }}>
              <div className="h-full w-px bg-[#27272a]/60 border-dashed" />
            </div>
            {/* Labels */}
            <div className="absolute -bottom-5 left-0 text-[10px] text-[#52525b]">Today</div>
            <div className="absolute -bottom-5 text-[10px] text-[#52525b] -translate-x-1/2" style={{ left: '33.33%' }}>30d</div>
            <div className="absolute -bottom-5 right-0 text-[10px] text-[#52525b]">90d</div>

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
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${markerColor(days)} ${markerBorder(days)} hover:scale-150 transition-transform cursor-pointer z-10`}
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

        {/* Upcoming deadlines */}
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Upcoming Deadlines</h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-[#52525b] text-center py-6">No upcoming deadlines</p>
          ) : (
            <div className="space-y-1">
              {upcomingDeadlines.map(ev => {
                const days = daysFromToday(ev.event_date)
                const contractName = (ev.contracts as { id?: string; contract_name?: string } | null)?.contract_name ?? 'Contract'
                return (
                  <Link
                    key={ev.id}
                    href={`/contracts/${ev.contract_id}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{contractName}</p>
                      <p className="text-xs text-[#a1a1aa] mt-0.5">{ev.event_label} · {formatDate(ev.event_date)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className={`text-sm font-semibold tabular-nums ${days < 14 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-green-400'}`}>
                        {days}d
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent contracts */}
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Contracts</h2>
            <Link href="/vault" className="text-xs text-accent hover:text-accent-hover transition-colors">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-[#52525b] text-center py-6">No contracts yet</p>
          ) : (
            <div className="space-y-1">
              {recent.map(c => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{c.contract_name}</p>
                      <p className="text-xs text-[#a1a1aa] mt-0.5 truncate">
                        {c.counterparty_name ?? 'Unknown counterparty'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status] ?? 'bg-[#1a1a1a] text-[#a1a1aa]'}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors" />
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
