'use client'

import {
  AlertTriangle, Bell, FileText, Search, Shield, TrendingUp, Filter,
  ChevronDown, MoreHorizontal, Calendar, DollarSign, MapPin,
  ShieldAlert, Zap, Activity, Clock, LayoutDashboard, FolderLock,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { AnimatedCounter } from './AnimatedCounter'

type Tab = 'dashboard' | 'contracts' | 'alerts' | 'risk'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={12} /> },
  { id: 'contracts', label: 'Contracts', icon: <FolderLock size={12} /> },
  { id: 'alerts', label: 'Alerts', icon: <Bell size={12} /> },
  { id: 'risk', label: 'Risk', icon: <ShieldAlert size={12} /> },
]

export function DashboardMockup() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div>
      {/* Hint chip that this is interactive */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.06] backdrop-blur px-3 py-1 text-[11px] text-primary">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
            <span className="relative rounded-full bg-primary size-1.5" />
          </span>
          Interactive preview — click any tab to explore
        </span>
      </div>

      <div className="relative rounded-2xl border border-border bg-[#0e0e10] shadow-card overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2/40 relative z-20">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
          <div className="ml-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Shield size={12} className="text-primary" />
            controva.co/{tab}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
              <span className="relative rounded-full bg-success size-1.5" />
            </span>
            Live
          </div>
        </div>

        {/* Mobile pill tabs — replace hidden sidebar */}
        <div className="sm:hidden flex overflow-x-auto gap-1 p-2 border-b border-border bg-[#0c0c0e] no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                tab === t.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground border border-transparent'
              }`}
              aria-selected={tab === t.id}
              role="tab"
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 min-h-[420px] relative">
          {/* sidebar — desktop only */}
          <aside className="col-span-2 border-r border-border p-3 hidden sm:flex flex-col gap-1 bg-[#0c0c0e]" role="tablist">
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="size-6 rounded-md bg-primary grid place-items-center text-[10px] font-bold text-primary-foreground shadow-glow-soft">C</div>
              <span className="text-xs font-semibold">Controva</span>
            </div>
            {tabs.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  role="tab"
                  aria-selected={active}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left transition-all ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-soft'
                      : 'text-muted-foreground border border-transparent hover:bg-white/[0.03] hover:text-foreground/90'
                  }`}
                >
                  <span className={active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground/80'}>
                    {t.icon}
                  </span>
                  {t.label}
                </button>
              )
            })}
            <button
              disabled
              className="mt-auto flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground/50 cursor-not-allowed"
            >
              <Activity size={12} />
              Settings
            </button>
          </aside>

          {/* main content — key remounts on tab change so the animation replays */}
          <div key={tab} className="col-span-12 sm:col-span-10 p-5 view-fade">
            {tab === 'dashboard' && <DashboardView />}
            {tab === 'contracts' && <ContractsView />}
            {tab === 'alerts' && <AlertsView />}
            {tab === 'risk' && <RiskView />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────── DASHBOARD VIEW ─────────── */

function DashboardView() {
  const [pulseIndex, setPulseIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPulseIndex((i) => (i + 1) % 4), 2400)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground">Portfolio overview</p>
          <h3 className="text-sm font-semibold">Good morning, Sarah</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5 bg-surface-2/50">
          <Search size={12} /> Search contracts
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label="Health Score" value={82} trend="+4" tone="success" icon={<TrendingUp size={14} />} />
        <Stat label="Active Contracts" value={24} trend="3 new" tone="primary" icon={<FileText size={14} />} />
        <Stat label="Upcoming Deadlines" value={7} trend="2 urgent" tone="warning" icon={<Bell size={14} />} pulse />
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 rounded-lg border border-border bg-surface-2/40 p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent contracts</p>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="size-1 rounded-full bg-primary animate-breathe" />
              Sorted by risk
            </span>
          </div>
          <div className="space-y-2">
            <ContractRow name="Commercial Lease — Brisbane CBD" date="14 days" risk="high" active={pulseIndex === 0} />
            <ContractRow name="Equipment Finance — Toyota Hilux" date="32 days" risk="med" active={pulseIndex === 1} />
            <ContractRow name="Supplier Agreement — Coffee Co." date="3 mo" risk="low" active={pulseIndex === 2} />
            <ContractRow name="Subcontractor — Apex Electrical" date="6 mo" risk="low" active={pulseIndex === 3} />
          </div>
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-surface-2/40 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Risk flags</p>
          <Flag tone="danger" text="Auto-renewal in 14 days" sub="Brisbane CBD lease" pulse />
          <Flag tone="warning" text="Personal liability clause" sub="Apex Electrical contract" />
          <Flag tone="primary" text="Price escalation trigger" sub="Coffee Co. supplier" />
        </div>
      </div>
    </>
  )
}

function Stat({
  label, value, trend, tone, icon, pulse,
}: {
  label: string; value: number; trend: string
  tone: 'success' | 'primary' | 'warning'; icon: React.ReactNode; pulse?: boolean
}) {
  const toneMap = { success: 'text-success', primary: 'text-primary', warning: 'text-warning' } as const
  return (
    <div className="relative rounded-lg border border-border bg-surface-2/40 p-3 overflow-hidden">
      {pulse && (
        <span className="absolute -top-6 -right-6 size-16 rounded-full bg-warning/10 blur-2xl animate-breathe" />
      )}
      <div className="relative flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={toneMap[tone]}>{icon}</span>
      </div>
      <div className="relative flex items-end justify-between">
        <AnimatedCounter to={value} duration={1400} className="text-xl font-semibold tracking-tight" />
        <span className={`text-[10px] ${toneMap[tone]}`}>{trend}</span>
      </div>
    </div>
  )
}

function ContractRow({
  name, date, risk, active,
}: { name: string; date: string; risk: 'high' | 'med' | 'low'; active?: boolean }) {
  const map = {
    high: { bg: 'bg-danger/15', text: 'text-danger', label: 'High risk' },
    med: { bg: 'bg-warning/15', text: 'text-warning', label: 'Medium' },
    low: { bg: 'bg-success/15', text: 'text-success', label: 'Low' },
  }[risk]
  return (
    <div
      className={`relative flex items-center justify-between gap-2 rounded-md px-2 py-2 transition-all duration-500 ${
        active ? 'bg-primary/[0.06] border border-primary/20' : 'border border-transparent hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={12} className="text-muted-foreground shrink-0" />
        <span className="text-[12px] truncate">{name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${map.bg} ${map.text}`}>{map.label}</span>
        <span className="text-[10px] text-muted-foreground w-14 text-right">{date}</span>
      </div>
    </div>
  )
}

function Flag({ tone, text, sub, pulse }: {
  tone: 'danger' | 'warning' | 'primary'; text: string; sub: string; pulse?: boolean
}) {
  const map = {
    danger: 'text-danger bg-danger/10 border-danger/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
  }[tone]
  return (
    <div className={`relative flex items-start gap-2 rounded-md p-2 mb-2 border ${map}`}>
      {pulse && (
        <span
          className="absolute -left-1 -top-1 size-2 rounded-full bg-danger"
          style={{ boxShadow: '0 0 0 0 rgba(239,68,68,0.7)', animation: 'pulse-ring 2s infinite' }}
        />
      )}
      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-tight">{text}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

/* ─────────── CONTRACTS VIEW ─────────── */

function ContractsView() {
  const [filter, setFilter] = useState<'all' | 'high' | 'med' | 'low'>('all')

  const contracts = [
    { name: 'Commercial Lease', party: 'Brisbane CBD Landlord', value: '$8,400/mo', expires: '14 days', risk: 'high' as const, tag: 'Lease' },
    { name: 'Equipment Finance', party: 'Toyota Financial Services', value: '$1,200/mo', expires: '32 days', risk: 'med' as const, tag: 'Finance' },
    { name: 'Supplier Agreement', party: 'Coffee Co. Australia', value: '$340/mo', expires: '3 mo', risk: 'low' as const, tag: 'Supplier' },
    { name: 'Subcontractor Deal', party: 'Apex Electrical', value: '$12,500', expires: '6 mo', risk: 'med' as const, tag: 'Contractor' },
    { name: 'Bunnings Trade Acc.', party: 'Bunnings Group', value: '~$1,800/mo', expires: 'Rolling', risk: 'low' as const, tag: 'Supplier' },
    { name: 'Optus Business Plan', party: 'Optus', value: '$180/mo', expires: '8 mo', risk: 'low' as const, tag: 'Utility' },
  ]

  const visible = filter === 'all' ? contracts : contracts.filter((c) => c.risk === filter)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Vault</p>
          <h3 className="text-sm font-semibold">All contracts <span className="text-muted-foreground font-normal">· {visible.length}</span></h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5 bg-surface-2/50">
          <Search size={12} /> Search
        </div>
      </div>

      {/* filter pills */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 mr-1">
          <Filter size={10} /> Filter
        </span>
        {([
          ['all', 'All', contracts.length],
          ['high', 'High risk', contracts.filter(c => c.risk === 'high').length],
          ['med', 'Medium', contracts.filter(c => c.risk === 'med').length],
          ['low', 'Low', contracts.filter(c => c.risk === 'low').length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
              filter === id
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label} <span className="opacity-60">{count}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded-md px-2 py-0.5">
          Sort: Risk <ChevronDown size={10} />
        </div>
      </div>

      {/* table header */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
        <div className="col-span-5">Name</div>
        <div className="col-span-3">Value</div>
        <div className="col-span-2">Expires</div>
        <div className="col-span-2 text-right">Risk</div>
      </div>

      <div className="space-y-1 mt-1 max-h-[280px] overflow-hidden">
        {visible.map((c) => (
          <ContractCard key={c.name + c.party} c={c} />
        ))}
      </div>
    </>
  )
}

function ContractCard({ c }: {
  c: {
    name: string; party: string; value: string; expires: string
    risk: 'high' | 'med' | 'low'; tag: string
  }
}) {
  const map = {
    high: { bg: 'bg-danger/15', text: 'text-danger', label: 'High' },
    med: { bg: 'bg-warning/15', text: 'text-warning', label: 'Medium' },
    low: { bg: 'bg-success/15', text: 'text-success', label: 'Low' },
  }[c.risk]
  return (
    <div className="grid grid-cols-12 items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/[0.02] border border-transparent hover:border-border transition-all">
      <div className="col-span-12 md:col-span-5 flex items-center gap-2.5 min-w-0">
        <div className="size-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
          <FileText size={12} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium truncate">{c.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{c.party} · {c.tag}</p>
        </div>
      </div>
      <div className="col-span-6 md:col-span-3 flex items-center gap-1 text-[11px]">
        <DollarSign size={10} className="text-muted-foreground" />
        {c.value}
      </div>
      <div className="col-span-6 md:col-span-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Calendar size={10} />
        {c.expires}
      </div>
      <div className="col-span-12 md:col-span-2 flex justify-end items-center gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${map.bg} ${map.text}`}>{map.label}</span>
        <MoreHorizontal size={12} className="text-muted-foreground" />
      </div>
    </div>
  )
}

/* ─────────── ALERTS VIEW ─────────── */

function AlertsView() {
  const groups = [
    {
      when: 'Today',
      tone: 'danger' as const,
      alerts: [
        { title: 'Auto-renewal window opens', contract: 'Brisbane CBD Commercial Lease', detail: '14 days to serve notice · $8,400/mo × 12', urgency: 'Critical' },
      ],
    },
    {
      when: 'This week',
      tone: 'warning' as const,
      alerts: [
        { title: 'Price escalation trigger', contract: 'Coffee Co. Supplier Agreement', detail: 'CPI + 2% clause activates 5 Aug', urgency: 'Action needed' },
        { title: 'Insurance renewal reminder', contract: 'Public Liability Policy', detail: 'Auto-debit on 7 Aug — $164/mo', urgency: 'Review' },
      ],
    },
    {
      when: 'Next 30 days',
      tone: 'primary' as const,
      alerts: [
        { title: 'Equipment finance review', contract: 'Toyota Hilux', detail: 'Balloon payment options open 22 Aug', urgency: 'Plan ahead' },
        { title: 'Subcontractor renewal', contract: 'Apex Electrical', detail: 'Contract ends 4 Sep — extend or re-quote', urgency: 'Plan ahead' },
      ],
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Alerts timeline</p>
          <h3 className="text-sm font-semibold">Upcoming deadlines <span className="text-muted-foreground font-normal">· 5</span></h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border">
            <Bell size={10} /> Email + SMS
          </span>
        </div>
      </div>

      <div className="relative pl-4">
        {/* vertical timeline rail */}
        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />

        {groups.map((g, i) => (
          <div key={g.when} className="relative mb-4">
            {/* rail node */}
            <div className={`absolute -left-[13px] top-1 size-3 rounded-full border-2 ${
              g.tone === 'danger' ? 'bg-danger border-danger/40' :
              g.tone === 'warning' ? 'bg-warning border-warning/40' :
              'bg-primary border-primary/40'
            } ${i === 0 ? 'shadow-glow-soft' : ''}`}>
              {i === 0 && (
                <span className="absolute inset-0 rounded-full border-2 border-danger/60 pulse-ring text-danger" />
              )}
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {g.when}
            </p>

            <div className="space-y-2">
              {g.alerts.map((a) => (
                <AlertCard key={a.title + a.contract} alert={a} tone={g.tone} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function AlertCard({
  alert, tone,
}: {
  alert: { title: string; contract: string; detail: string; urgency: string }
  tone: 'danger' | 'warning' | 'primary'
}) {
  const map = {
    danger: { border: 'border-danger/25', bg: 'bg-danger/[0.04]', chip: 'bg-danger/15 text-danger', icon: <ShieldAlert size={11} className="text-danger" /> },
    warning: { border: 'border-warning/25', bg: 'bg-warning/[0.04]', chip: 'bg-warning/15 text-warning', icon: <Clock size={11} className="text-warning" /> },
    primary: { border: 'border-primary/20', bg: 'bg-primary/[0.03]', chip: 'bg-primary/15 text-primary', icon: <Calendar size={11} className="text-primary" /> },
  }[tone]

  return (
    <div className={`rounded-md border ${map.border} ${map.bg} p-2.5`}>
      <div className="flex items-start gap-2">
        <div className="size-6 rounded bg-surface-2/60 grid place-items-center shrink-0 mt-0.5">
          {map.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-medium leading-tight">{alert.title}</p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${map.chip} shrink-0`}>{alert.urgency}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{alert.contract}</p>
          <p className="text-[10px] text-foreground/70 mt-1">{alert.detail}</p>
        </div>
      </div>
    </div>
  )
}

/* ─────────── RISK VIEW ─────────── */

function RiskView() {
  const categories = [
    { label: 'Financial', score: 68, tone: 'warning' as const },
    { label: 'Legal', score: 82, tone: 'success' as const },
    { label: 'Operational', score: 74, tone: 'primary' as const },
  ]

  const topRisks = [
    { title: 'Personal guarantee clause', contract: 'Brisbane CBD Lease', severity: 'high' as const, cat: 'Legal' },
    { title: 'Auto-renewal without notice', contract: 'Brisbane CBD Lease', severity: 'high' as const, cat: 'Financial' },
    { title: 'CPI escalation trigger', contract: 'Coffee Co. Supplier', severity: 'med' as const, cat: 'Financial' },
    { title: 'Broad indemnity language', contract: 'Apex Electrical', severity: 'med' as const, cat: 'Legal' },
    { title: 'Non-compete radius clause', contract: 'Apex Electrical', severity: 'low' as const, cat: 'Operational' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Portfolio risk</p>
          <h3 className="text-sm font-semibold">Overall health <span className="text-success font-normal">Good</span></h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Zap size={10} className="text-primary" /> Updated 3 min ago
        </div>
      </div>

      {/* Radial gauge + category bars */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="col-span-2 rounded-lg border border-border bg-surface-2/40 p-3 flex flex-col items-center justify-center">
          <RadialGauge value={82} />
          <p className="text-[10px] text-muted-foreground mt-2">Portfolio health score</p>
          <p className="text-[10px] text-success mt-0.5 inline-flex items-center gap-1">
            <TrendingUp size={10} /> +4 vs last month
          </p>
        </div>
        <div className="col-span-3 rounded-lg border border-border bg-surface-2/40 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">By category</p>
          <div className="space-y-3">
            {categories.map((c) => (
              <CategoryBar key={c.label} {...c} />
            ))}
          </div>
        </div>
      </div>

      {/* Top risks list */}
      <div className="rounded-lg border border-border bg-surface-2/40 p-3">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Top risks</p>
          <span className="text-[10px] text-muted-foreground">{topRisks.length} identified</span>
        </div>
        <div className="space-y-1.5">
          {topRisks.map((r) => (
            <RiskRow key={r.title} {...r} />
          ))}
        </div>
      </div>
    </>
  )
}

function RadialGauge({ value }: { value: number }) {
  const r = 32
  const c = 2 * Math.PI * r
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const dur = 1400
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(value * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  const offset = c - (displayed / 100) * c

  return (
    <div className="relative size-24">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.6))' }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-semibold tracking-tight">{Math.round(displayed)}</span>
      </div>
    </div>
  )
}

function CategoryBar({
  label, score, tone,
}: { label: string; score: number; tone: 'success' | 'warning' | 'primary' }) {
  const toneMap = {
    success: 'from-success/70 to-success',
    warning: 'from-warning/70 to-warning',
    primary: 'from-primary/70 to-secondary',
  }[tone]
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setWidth(score), 100)
    return () => clearTimeout(id)
  }, [score])
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px]">{label}</span>
        <span className="text-[10px] text-muted-foreground">{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneMap} transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function RiskRow({
  title, contract, severity, cat,
}: {
  title: string; contract: string
  severity: 'high' | 'med' | 'low'; cat: string
}) {
  const map = {
    high: { bg: 'bg-danger/15', text: 'text-danger', label: 'High' },
    med: { bg: 'bg-warning/15', text: 'text-warning', label: 'Medium' },
    low: { bg: 'bg-success/15', text: 'text-success', label: 'Low' },
  }[severity]
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.02] transition-colors">
      <AlertTriangle size={11} className={map.text + ' shrink-0'} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground truncate inline-flex items-center gap-1">
          <MapPin size={9} /> {contract} <span className="opacity-50">·</span> {cat}
        </p>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${map.bg} ${map.text} shrink-0`}>{map.label}</span>
    </div>
  )
}
