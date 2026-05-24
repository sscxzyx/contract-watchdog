import { AlertTriangle, Bell, FileText, Search, Shield, TrendingUp } from 'lucide-react'

export function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border border-border bg-[#0e0e10] shadow-card overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2/40">
        <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
        <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
        <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        <div className="ml-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Shield size={12} className="text-primary" />
          controva.co/dashboard
        </div>
      </div>

      <div className="grid grid-cols-12 min-h-[420px]">
        {/* sidebar */}
        <aside className="col-span-2 border-r border-border p-3 hidden sm:flex flex-col gap-1 bg-[#0c0c0e]">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="size-6 rounded-md bg-primary grid place-items-center text-[10px] font-bold text-primary-foreground">C</div>
            <span className="text-xs font-semibold">Controva</span>
          </div>
          {['Dashboard', 'Contracts', 'Alerts', 'Risk', 'Settings'].map((l, i) => (
            <div
              key={l}
              className={`px-2 py-1.5 rounded-md text-[11px] ${
                i === 0
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground'
              }`}
            >
              {l}
            </div>
          ))}
        </aside>

        {/* main */}
        <div className="col-span-12 sm:col-span-10 p-5">
          {/* top bar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-muted-foreground">Portfolio overview</p>
              <h3 className="text-sm font-semibold">Good morning, Sarah</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5 bg-surface-2/50">
              <Search size={12} /> Search contracts
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="Health Score" value="82" trend="+4" tone="success" icon={<TrendingUp size={14} />} />
            <Stat label="Active Contracts" value="24" trend="3 new" tone="primary" icon={<FileText size={14} />} />
            <Stat label="Upcoming Deadlines" value="7" trend="2 urgent" tone="warning" icon={<Bell size={14} />} />
          </div>

          {/* table + flags */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 rounded-lg border border-border bg-surface-2/40 p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent contracts</p>
                <span className="text-[10px] text-muted-foreground">Sorted by risk</span>
              </div>
              <div className="space-y-2">
                <ContractRow name="Commercial Lease — Brisbane CBD" date="14 days" risk="high" />
                <ContractRow name="Equipment Finance — Toyota Hilux" date="32 days" risk="med" />
                <ContractRow name="Supplier Agreement — Coffee Co." date="3 mo" risk="low" />
                <ContractRow name="Subcontractor — Apex Electrical" date="6 mo" risk="low" />
              </div>
            </div>
            <div className="col-span-2 rounded-lg border border-border bg-surface-2/40 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Risk flags</p>
              <Flag tone="danger" text="Auto-renewal in 14 days" sub="Brisbane CBD lease" />
              <Flag tone="warning" text="Personal liability clause" sub="Apex Electrical contract" />
              <Flag tone="primary" text="Price escalation trigger" sub="Coffee Co. supplier" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label, value, trend, tone, icon,
}: { label: string; value: string; trend: string; tone: 'success' | 'primary' | 'warning'; icon: React.ReactNode }) {
  const toneMap = {
    success: 'text-success',
    primary: 'text-primary',
    warning: 'text-warning',
  } as const
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={toneMap[tone]}>{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold tracking-tight">{value}</span>
        <span className={`text-[10px] ${toneMap[tone]}`}>{trend}</span>
      </div>
    </div>
  )
}

function ContractRow({ name, date, risk }: { name: string; date: string; risk: 'high' | 'med' | 'low' }) {
  const map = {
    high: { bg: 'bg-danger/15', text: 'text-danger', label: 'High risk' },
    med: { bg: 'bg-warning/15', text: 'text-warning', label: 'Medium' },
    low: { bg: 'bg-success/15', text: 'text-success', label: 'Low' },
  }[risk]
  return (
    <div className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-white/[0.02]">
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

function Flag({ tone, text, sub }: { tone: 'danger' | 'warning' | 'primary'; text: string; sub: string }) {
  const map = {
    danger: 'text-danger bg-danger/10 border-danger/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
  }[tone]
  return (
    <div className={`flex items-start gap-2 rounded-md p-2 mb-2 border ${map}`}>
      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-tight">{text}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
