'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutGrid, List, Search, Upload, FileText,
  ChevronUp, ChevronDown, ChevronsUpDown, X, Lock, Zap, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── types ───────────────────────────────────────────────────────────────────

interface ContractRow {
  id: string
  contract_name: string
  counterparty_name: string | null
  contract_type: string | null
  status: string
  risk_level: string | null
  health_score: number | null
  contract_value: number | null
  value_currency: string | null
  end_date: string | null
  created_at: string
  ai_summary: string | null
  contract_events: { id: string; event_date: string; event_label: string }[]
}

type SortKey = 'end_date' | 'risk_level' | 'contract_value' | 'created_at' | 'status' | 'contract_type'
type ViewMode = 'grid' | 'list'

// ─── helpers ─────────────────────────────────────────────────────────────────

const RISK_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 }
const STATUS_ORDER: Record<string, number> = { expired: 0, expiring_soon: 1, needs_review: 2, active: 3 }

const STATUS_LABEL: Record<string, string> = {
  active: 'Active', expiring_soon: 'Expiring Soon',
  expired: 'Expired', needs_review: 'Needs Review',
}
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-400/10 text-green-400 border-green-400/20',
  expiring_soon: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  expired: 'bg-red-400/10 text-red-400 border-red-400/20',
  needs_review: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
}

function healthGrade(score: number | null): { grade: string; color: string } {
  if (score === null) return { grade: '—', color: 'text-[#52525b]' }
  if (score >= 80) return { grade: 'A', color: 'text-green-400' }
  if (score >= 60) return { grade: 'B', color: 'text-lime-400' }
  if (score >= 40) return { grade: 'C', color: 'text-amber-400' }
  if (score >= 20) return { grade: 'D', color: 'text-orange-400' }
  return { grade: 'F', color: 'text-red-400' }
}

function formatValue(value: number | null, currency: string | null): string {
  if (value === null) return 'Value not specified'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: currency ?? 'GBP', maximumFractionDigits: 0,
  }).format(value)
}

function getNextEvent(events: ContractRow['contract_events']) {
  const today = new Date().toISOString().split('T')[0]
  const future = events.filter(e => e.event_date >= today)
  if (!future.length) return null
  return future.reduce((min, e) => e.event_date < min.event_date ? e : min)
}

function daysUntil(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function sortContracts(list: ContractRow[], key: SortKey, dir: 'asc' | 'desc') {
  return [...list].sort((a, b) => {
    let cmp = 0
    if (key === 'end_date') {
      cmp = (a.end_date ?? '9999').localeCompare(b.end_date ?? '9999')
    } else if (key === 'risk_level') {
      cmp = (RISK_ORDER[a.risk_level ?? ''] ?? 0) - (RISK_ORDER[b.risk_level ?? ''] ?? 0)
    } else if (key === 'contract_value') {
      cmp = (a.contract_value ?? -1) - (b.contract_value ?? -1)
    } else if (key === 'created_at') {
      cmp = a.created_at.localeCompare(b.created_at)
    } else if (key === 'status') {
      cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
    } else if (key === 'contract_type') {
      cmp = (a.contract_type ?? '').localeCompare(b.contract_type ?? '')
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── sub-components ───────────────────────────────────────────────────────────

function GridCard({ c }: { c: ContractRow }) {
  const next = getNextEvent(c.contract_events)
  const grade = healthGrade(c.health_score)
  return (
    <Link
      href={`/contracts/${c.id}`}
      className="bg-surface border border-[#27272a] hover:border-[#3f3f46] rounded-xl p-5 flex flex-col gap-3 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{c.contract_name}</p>
          <p className="text-xs text-[#a1a1aa] mt-0.5 truncate">
            {c.counterparty_name ?? 'Unknown counterparty'}
          </p>
        </div>
        <span className={`text-lg font-bold shrink-0 ${grade.color}`}>{grade.grade}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#a1a1aa]">{c.contract_type ?? 'Unknown type'}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_BADGE[c.status] ?? 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a]'}`}>
          {STATUS_LABEL[c.status] ?? c.status}
        </span>
      </div>

      <div className="pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
        <span className="text-xs text-[#a1a1aa]">
          {formatValue(c.contract_value, c.value_currency)}
        </span>
        {next ? (
          <span className={`text-xs font-medium tabular-nums ${
            daysUntil(next.event_date) < 14 ? 'text-red-400'
            : daysUntil(next.event_date) < 30 ? 'text-amber-400'
            : 'text-[#a1a1aa]'
          }`}>
            {daysUntil(next.event_date)}d
          </span>
        ) : (
          <span className="text-xs text-[#52525b]">No upcoming dates</span>
        )}
      </div>
    </Link>
  )
}

function ListRow({ c }: { c: ContractRow }) {
  const next = getNextEvent(c.contract_events)
  const grade = healthGrade(c.health_score)
  return (
    <Link
      href={`/contracts/${c.id}`}
      className="flex items-center gap-4 px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-white/5 transition-colors group"
    >
      <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-[#a1a1aa]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{c.contract_name}</p>
        <p className="text-xs text-[#a1a1aa] truncate">{c.counterparty_name ?? 'Unknown'}</p>
      </div>
      <span className="text-xs text-[#a1a1aa] w-28 truncate shrink-0 hidden md:block">
        {c.contract_type ?? '—'}
      </span>
      <span className={`text-sm font-bold w-8 text-center shrink-0 ${grade.color}`}>{grade.grade}</span>
      <span className="text-xs text-[#a1a1aa] w-32 truncate shrink-0 hidden lg:block">
        {formatValue(c.contract_value, c.value_currency)}
      </span>
      <span className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 w-28 text-center hidden sm:block ${STATUS_BADGE[c.status] ?? 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a]'}`}>
        {STATUS_LABEL[c.status] ?? c.status}
      </span>
      <span className={`text-xs font-medium w-12 text-right shrink-0 tabular-nums ${
        next && daysUntil(next.event_date) < 14 ? 'text-red-400'
        : next && daysUntil(next.event_date) < 30 ? 'text-amber-400'
        : 'text-[#52525b]'
      }`}>
        {next ? `${daysUntil(next.event_date)}d` : '—'}
      </span>
    </Link>
  )
}

// ─── sort button ─────────────────────────────────────────────────────────────

function SortButton({ label, k, current, dir, onSort }: {
  label: string; k: SortKey
  current: SortKey; dir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = current === k
  return (
    <button
      onClick={() => onSort(k)}
      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
        active ? 'bg-accent/10 text-accent' : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
      {active
        ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        : <ChevronsUpDown className="w-3 h-3 opacity-40" />
      }
    </button>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function VaultPage() {
  return (
    <Suspense>
      <VaultContent />
    </Suspense>
  )
}

function VaultContent() {
  const searchParams = useSearchParams()
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [planTier, setPlanTier] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  async function handleUpgrade() {
    setUpgrading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'starter' }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setUpgrading(false)
  }
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterRisk, setFilterRisk] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string[]>([])

  // Apply URL filter params from dashboard cards
  useEffect(() => {
    const f = searchParams.get('filter')
    if (f === 'expiring_soon') setFilterStatus(['expiring_soon'])
    else if (f === 'needs_review') setFilterStatus(['needs_review'])
    else if (f === 'high_risk') setFilterRisk(['high'])
  }, [searchParams])

  // Fetch plan tier + contracts
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: profile }, { data, error }] = await Promise.all([
        supabase.from('users').select('plan_tier').single(),
        supabase
          .from('contracts')
          .select('id, contract_name, counterparty_name, contract_type, status, risk_level, health_score, contract_value, value_currency, end_date, created_at, ai_summary, contract_events(id, event_date, event_label)')
          .order('created_at', { ascending: false }),
      ])
      setPlanTier(profile?.plan_tier ?? 'free')
      if (error) {
        setFetchError(true)
      } else {
        setContracts((data as ContractRow[]) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const contractTypes = useMemo(
    () => Array.from(new Set(contracts.map(c => c.contract_type).filter(Boolean))) as string[],
    [contracts]
  )

  const filtered = useMemo(() => {
    let r = contracts
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(c =>
        c.contract_name.toLowerCase().includes(q) ||
        (c.counterparty_name ?? '').toLowerCase().includes(q) ||
        (c.ai_summary ?? '').toLowerCase().includes(q)
      )
    }
    if (filterStatus.length) r = r.filter(c => filterStatus.includes(c.status))
    if (filterRisk.length) r = r.filter(c => c.risk_level !== null && filterRisk.includes(c.risk_level))
    if (filterType.length) r = r.filter(c => c.contract_type !== null && filterType.includes(c.contract_type))
    return sortContracts(r, sortKey, sortDir)
  }, [contracts, search, filterStatus, filterRisk, filterType, sortKey, sortDir])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  function toggleFilter(set: string[], setFn: (v: string[]) => void, value: string) {
    setFn(set.includes(value) ? set.filter(v => v !== value) : [...set, value])
  }

  const hasFilters = filterStatus.length > 0 || filterRisk.length > 0 || filterType.length > 0 || search

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── error state ──────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-400 text-sm mb-2">Failed to load contracts</p>
        <p className="text-[#52525b] text-xs">Check your connection and refresh the page</p>
      </div>
    )
  }

  // ── free tier gate ───────────────────────────────────────────────────────
  if (planTier === 'free') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Vault is a paid feature</h1>
        <p className="text-[#a1a1aa] text-sm max-w-xs mb-8">
          Upgrade to Starter to browse, search, and manage all your contracts in one place.
        </p>
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {upgrading ? 'Redirecting…' : 'Upgrade to Starter — A$29/mo'}
        </button>
        <p className="text-xs text-[#52525b] mt-3">14-day free trial · Cancel anytime</p>
      </div>
    )
  }

  // ── empty state ──────────────────────────────────────────────────────────
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Your vault is empty</h1>
        <p className="text-[#a1a1aa] text-sm max-w-xs mb-8">
          Upload your first contract to see it here, analysed and organised.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload a contract
        </Link>
      </div>
    )
  }

  // ── main ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Vault</h1>
          <p className="text-[#a1a1aa] mt-1 text-sm">{filtered.length} of {contracts.length} contracts</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Link>
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contracts, counterparties, summaries…"
            className="w-full bg-surface border border-[#27272a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[#52525b] hover:text-white transition-colors" />
            </button>
          )}
        </div>
        <div className="flex items-center border border-[#27272a] rounded-lg overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-accent/10 text-accent' : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2.5 transition-colors ${view === 'list' ? 'bg-accent/10 text-accent' : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#52525b] font-medium">Filter:</span>

        {(['active', 'expiring_soon', 'expired', 'needs_review'] as const).map(s => (
          <button
            key={s}
            onClick={() => toggleFilter(filterStatus, setFilterStatus, s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filterStatus.includes(s)
                ? STATUS_BADGE[s]
                : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}

        <span className="w-px h-4 bg-[#27272a]" />

        {(['low', 'medium', 'high'] as const).map(r => (
          <button
            key={r}
            onClick={() => toggleFilter(filterRisk, setFilterRisk, r)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
              filterRisk.includes(r)
                ? r === 'high' ? 'bg-red-400/10 text-red-400 border-red-400/20'
                  : r === 'medium' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                  : 'bg-green-400/10 text-green-400 border-green-400/20'
                : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
            }`}
          >
            {r} risk
          </button>
        ))}

        {contractTypes.length > 0 && (
          <>
            <span className="w-px h-4 bg-[#27272a]" />
            {contractTypes.map(t => (
              <button
                key={t}
                onClick={() => toggleFilter(filterType, setFilterType, t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filterType.includes(t)
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : 'border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </>
        )}

        {hasFilters && (
          <button
            onClick={() => { setFilterStatus([]); setFilterRisk([]); setFilterType([]); setSearch('') }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#a1a1aa] hover:text-white border border-[#27272a] hover:border-[#3f3f46] transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-[#52525b] font-medium mr-1">Sort:</span>
        {([
          ['End Date', 'end_date'],
          ['Risk', 'risk_level'],
          ['Value', 'contract_value'],
          ['Uploaded', 'created_at'],
          ['Status', 'status'],
          ['Type', 'contract_type'],
        ] as [string, SortKey][]).map(([label, k]) => (
          <SortButton key={k} label={label} k={k} current={sortKey} dir={sortDir} onSort={toggleSort} />
        ))}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[#a1a1aa] text-sm">No contracts match your search or filters.</p>
          <button
            onClick={() => { setFilterStatus([]); setFilterRisk([]); setFilterType([]); setSearch('') }}
            className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => <GridCard key={c.id} c={c} />)}
        </div>
      )}

      {/* List view */}
      {view === 'list' && filtered.length > 0 && (
        <div className="bg-surface border border-[#27272a] rounded-xl overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1a1a1a] text-xs text-[#52525b] font-medium">
            <div className="w-7 shrink-0" />
            <span className="flex-1">Contract</span>
            <span className="w-28 shrink-0 hidden md:block">Type</span>
            <span className="w-8 text-center shrink-0">Grade</span>
            <span className="w-32 shrink-0 hidden lg:block">Value</span>
            <span className="w-28 text-center shrink-0 hidden sm:block">Status</span>
            <span className="w-12 text-right shrink-0">Next</span>
          </div>
          {filtered.map(c => <ListRow key={c.id} c={c} />)}
        </div>
      )}
    </div>
  )
}
