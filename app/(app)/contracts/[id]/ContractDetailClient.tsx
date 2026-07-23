'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, AlertTriangle, CheckCircle, Info,
  Calendar, DollarSign, Shield, Activity,
  Download, Trash2, Edit2, Check, X as XIcon,
  FileText, Wand2, Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Contract, ContractEvent, AlertLog, RiskLevel } from '@/types/database'

// ─── constants ────────────────────────────────────────────────────────────────

const RISK_COLOUR: Record<RiskLevel, string> = {
  low: 'text-success bg-success/15 border-success/20',
  medium: 'text-warning bg-warning/15 border-warning/20',
  high: 'text-danger bg-danger/15 border-danger/20',
}

const SEVERITY_ICON: Record<RiskLevel, React.ReactNode> = {
  low: <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />,
  medium: <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />,
  high: <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />,
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-success/15 text-success border-success/20',
  expiring_soon: 'bg-warning/15 text-warning border-warning/20',
  expired: 'bg-danger/15 text-danger border-danger/20',
  needs_review: 'bg-secondary/15 text-secondary border-secondary/20',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  needs_review: 'Needs Review',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function healthColour(score: number | null) {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-danger'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(value: number | null, currency: string | null) {
  if (value === null) return 'Value not specified'
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency ?? 'AUD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    // Unknown currency code from extraction — show the raw amount
    return `${currency ?? ''} ${value.toLocaleString('en-AU')}`.trim()
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function DeleteModal({ contractName, onConfirm, onCancel, loading, error }: {
  contractName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-danger/10">
            <Trash2 className="w-5 h-5 text-danger" />
          </div>
          <h2 className="text-foreground font-semibold text-lg">Delete contract</h2>
        </div>
        {error && (
          <p className="mb-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <p className="text-muted-foreground text-sm mb-6">
          Are you sure you want to delete{' '}
          <span className="text-foreground font-medium">{contractName}</span>?
          This will permanently remove the contract and all its data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-danger hover:bg-danger/90 text-foreground text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentViewer({ signedUrl, fileName }: { signedUrl: string | null; fileName: string | null }) {
  const isPdf = (fileName ?? '').toLowerCase().endsWith('.pdf')

  if (!signedUrl) {
    return (
      <div className="rounded-xl border border-border bg-surface-2/40 p-8 flex flex-col items-center justify-center text-center h-48">
        <FileText className="w-8 h-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm text-muted-foreground/60">Document not available</p>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="rounded-xl border border-border bg-surface-2/40 overflow-hidden" style={{ height: 600 }}>
        {/* Sandbox the embedded document: a user-uploaded PDF is untrusted content.
            allow-same-origin lets the browser's native PDF viewer load from the
            signed storage URL, but scripts/forms/popups stay disabled so a
            booby-trapped file can't run code or navigate the parent. */}
        <iframe
          src={signedUrl}
          className="w-full h-full"
          title="Contract PDF"
          sandbox="allow-same-origin"
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-8 flex flex-col items-center justify-center text-center h-48">
      <FileText className="w-10 h-10 text-muted-foreground/60 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">DOCX files cannot be previewed in the browser</p>
      <a
        href={signedUrl}
        download={fileName ?? undefined}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <Download className="w-4 h-4" /> Download to view
      </a>
    </div>
  )
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  contract: Contract
  events: ContractEvent[]
  alerts: AlertLog[]
  signedUrl: string | null
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ContractDetailClient({ contract: initialContract, events, alerts, signedUrl }: Props) {
  const router = useRouter()
  const [contract, setContract] = useState(initialContract)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(initialContract.contract_name)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const analysis = contract.ai_analysis_json

  async function saveName() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === contract.contract_name) {
      setEditing(false)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('contracts')
      .update({ contract_name: trimmed })
      .eq('id', contract.id)
    if (error) {
      setSaving(false)
      setEditing(false)
      setEditName(contract.contract_name)
      return
    }
    setContract(c => ({ ...c, contract_name: trimmed }))
    setSaving(false)
    setEditing(false)
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const supabase = createClient()
    if (contract.file_url) {
      await supabase.storage.from('contracts').remove([contract.file_url])
    }
    const { error } = await supabase.from('contracts').delete().eq('id', contract.id)
    if (error) {
      setDeleteError('Failed to delete the contract — please try again.')
      setDeleting(false)
      return
    }
    router.push('/vault')
    router.refresh()
  }

  // Build unified activity log
  type ActivityItem = { id: string; date: string; label: string; dot: 'primary' | 'amber' | 'muted' }
  const activityItems: ActivityItem[] = ([
    { id: 'upload', date: contract.created_at, label: 'Contract uploaded and AI analysis completed', dot: 'primary' as const },
    ...events.map(e => ({ id: e.id, date: e.event_date, label: e.event_label, dot: 'muted' as const })),
    ...alerts.map(a => ({
      id: a.id,
      date: a.sent_at,
      label: `Alert sent: ${a.alert_type.replace(/_/g, ' ')} (${a.days_before} days before)`,
      dot: 'amber' as const,
    })),
  ] as ActivityItem[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-6xl">
      {showDeleteModal && (
        <DeleteModal
          contractName={contract.contract_name}
          onConfirm={handleDelete}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(null) }}
          loading={deleting}
          error={deleteError}
        />
      )}

      {/* Back */}
      <Link
        href="/vault"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Vault
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') { setEditing(false); setEditName(contract.contract_name) }
                }}
                className="text-2xl font-semibold text-foreground bg-surface-2/60 border border-primary/40 rounded-lg px-3 py-1 outline-none focus:border-primary w-full"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditing(false); setEditName(contract.contract_name) }}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">{contract.contract_name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5 transition-colors"
                title="Rename contract"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_BADGE[contract.status]}`}>
                {STATUS_LABEL[contract.status]}
              </span>
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            {contract.counterparty_name ?? 'Counterparty unknown'} · {contract.contract_type ?? 'Unknown type'}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:shrink-0">
          <div className="text-left sm:text-right mr-2">
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(contract.contract_value, contract.value_currency)}
            </p>
            <p className="text-xs text-muted-foreground">Contract value</p>
          </div>
          {signedUrl && (
            <a
              href={signedUrl}
              download={contract.file_name}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-danger/20 text-danger hover:bg-danger/10 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-surface-2/40 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Health Score</span>
            <Activity className={`w-4 h-4 ${healthColour(contract.health_score)}`} />
          </div>
          <p className={`text-2xl font-semibold tracking-tight ${healthColour(contract.health_score)}`}>
            {contract.health_score ?? '—'}{contract.health_score !== null ? '/100' : ''}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/40 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Level</span>
            <Shield className={`w-4 h-4 ${contract.risk_level ? RISK_COLOUR[contract.risk_level].split(' ')[0] : 'text-muted-foreground'}`} />
          </div>
          {contract.risk_level ? (
            <span className={`inline-flex px-2.5 py-1 rounded-md text-sm font-medium border capitalize ${RISK_COLOUR[contract.risk_level]}`}>
              {contract.risk_level}
            </span>
          ) : (
            <p className="text-2xl font-semibold text-muted-foreground">—</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface-2/40 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Importance</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {contract.importance_score ?? '—'}{contract.importance_score !== null ? '/10' : ''}
          </p>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* Left column — AI analysis */}
        <div className="lg:col-span-3 space-y-6">

          {contract.ai_summary && (
            <div className="rounded-xl border border-border bg-surface-2/40 p-5">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Summary</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{contract.ai_summary}</p>
            </div>
          )}

          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-surface-2/60 border border-border">
            <Info className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              This analysis is AI-generated and provided as a monitoring aid only. It is not legal advice
              and may contain errors — always verify critical dates and terms against the original document,
              and consult a qualified legal professional for decisions about this contract.
            </p>
          </div>

          {(analysis?.risk_flags?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-border bg-surface-2/40 p-5">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Risk Flags</h2>
              <div className="space-y-3">
                {(analysis?.risk_flags ?? []).map((flag, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {SEVERITY_ICON[flag.severity] ?? SEVERITY_ICON.medium}
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {((analysis?.obligations_ours?.length ?? 0) > 0 || (analysis?.obligations_theirs?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-border bg-surface-2/40 p-5">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Obligations</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Ours</p>
                  <ul className="space-y-1.5">
                    {(analysis?.obligations_ours ?? []).map((o, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Theirs</p>
                  <ul className="space-y-1.5">
                    {(analysis?.obligations_theirs ?? []).map((o, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {(analysis?.cancellation_terms || analysis?.renewal_terms) && (
            <div className="rounded-xl border border-border bg-surface-2/40 p-5 space-y-4">
              {analysis?.cancellation_terms && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cancellation</h3>
                  <p className="text-sm text-muted-foreground">{analysis.cancellation_terms}</p>
                </div>
              )}
              {analysis?.renewal_terms && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Renewal</h3>
                  <p className="text-sm text-muted-foreground">{analysis.renewal_terms}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface-2/40 p-5">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Key Dates
            </h2>
            <div>
              {[
                { label: 'Start date', value: formatDate(contract.start_date) },
                { label: 'End date', value: formatDate(contract.end_date) },
                { label: 'Renewal date', value: formatDate(contract.renewal_date) },
                { label: 'Notice deadline', value: formatDate(contract.notice_deadline) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm py-2 border-b border-border/60 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
              {events.map(ev => (
                <div key={ev.id} className="flex justify-between text-sm py-2 border-b border-border/60 last:border-0">
                  <span className="text-muted-foreground">{ev.event_label}</span>
                  <span className="text-foreground">{formatDate(ev.event_date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — document viewer */}
        <div className="lg:col-span-2">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Document
          </h2>
          <DocumentViewer signedUrl={signedUrl} fileName={contract.file_name} />
        </div>
      </div>

      {/* Negotiation Advisor — Coming Soon */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04] p-6 mb-8">
        <span className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/15 blur-3xl animate-breathe" />
        <div className="relative flex items-center gap-3 mb-2">
          <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shadow-glow-soft shrink-0">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Negotiation Advisor</h2>
            <span className="inline-flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              <span className="size-1 rounded-full bg-primary animate-breathe" /> Coming Soon
            </span>
          </div>
        </div>
        <p className="relative text-sm text-muted-foreground leading-relaxed ml-[52px]">
          Get AI-powered negotiation recommendations specific to this contract — suggested clause improvements,
          red-line priorities, and leverage points based on your position.
        </p>
      </div>

      {/* Activity log */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-5">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5" /> Activity Log
        </h2>
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">No activity yet</p>
        ) : (
          <div>
            {activityItems.map(item => (
              <div key={item.id} className="flex items-start gap-4 py-3 border-b border-border/60 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  item.dot === 'primary' ? 'bg-primary' :
                  item.dot === 'amber' ? 'bg-warning' :
                  'bg-border'
                }`} />
                <p className="flex-1 text-sm text-muted-foreground">{item.label}</p>
                <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
                  {item.dot === 'muted' ? formatDate(item.date) : formatDateTime(item.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
