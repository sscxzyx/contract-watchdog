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
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const SEVERITY_ICON: Record<RiskLevel, React.ReactNode> = {
  low: <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />,
  medium: <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
  high: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-400/10 text-green-400 border-green-400/20',
  expiring_soon: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  expired: 'bg-red-400/10 text-red-400 border-red-400/20',
  needs_review: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  needs_review: 'Needs Review',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function healthColour(score: number | null) {
  if (score === null) return 'text-[#a1a1aa]'
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(value: number | null, currency: string | null) {
  if (value === null) return 'Value not specified'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency ?? 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function DeleteModal({ contractName, onConfirm, onCancel, loading }: {
  contractName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-[#27272a] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-400/10">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg">Delete contract</h2>
        </div>
        <p className="text-[#a1a1aa] text-sm mb-6">
          Are you sure you want to delete{' '}
          <span className="text-white font-medium">{contractName}</span>?
          This will permanently remove the contract and all its data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
      <div className="bg-surface border border-[#27272a] rounded-xl p-8 flex flex-col items-center justify-center text-center h-48">
        <FileText className="w-8 h-8 text-[#52525b] mb-2" />
        <p className="text-sm text-[#52525b]">Document not available</p>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="bg-surface border border-[#27272a] rounded-xl overflow-hidden" style={{ height: 600 }}>
        <iframe src={signedUrl} className="w-full h-full" title="Contract PDF" />
      </div>
    )
  }

  return (
    <div className="bg-surface border border-[#27272a] rounded-xl p-8 flex flex-col items-center justify-center text-center h-48">
      <FileText className="w-10 h-10 text-[#52525b] mb-3" />
      <p className="text-sm text-[#a1a1aa] mb-4">DOCX files cannot be previewed in the browser</p>
      <a
        href={signedUrl}
        download={fileName ?? undefined}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
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
    if (!error) setContract(c => ({ ...c, contract_name: trimmed }))
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    if (contract.file_url) {
      await supabase.storage.from('contracts').remove([contract.file_url])
    }
    await supabase.from('contracts').delete().eq('id', contract.id)
    router.push('/vault')
  }

  // Build unified activity log
  type ActivityItem = { id: string; date: string; label: string; dot: 'accent' | 'amber' | 'muted' }
  const activityItems: ActivityItem[] = ([
    { id: 'upload', date: contract.created_at, label: 'Contract uploaded and AI analysis completed', dot: 'accent' as const },
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
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}

      {/* Back */}
      <Link
        href="/vault"
        className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Vault
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
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
                className="text-2xl font-semibold text-white bg-[#1a1a1a] border border-accent/40 rounded-lg px-3 py-1 outline-none focus:border-accent w-full"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors shrink-0 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditing(false); setEditName(contract.contract_name) }}
                className="p-2 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors shrink-0"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-semibold text-white">{contract.contract_name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/5 transition-colors"
                title="Rename contract"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_BADGE[contract.status]}`}>
                {STATUS_LABEL[contract.status]}
              </span>
            </div>
          )}
          <p className="text-[#a1a1aa] text-sm">
            {contract.counterparty_name ?? 'Counterparty unknown'} · {contract.contract_type ?? 'Unknown type'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right mr-2">
            <p className="text-lg font-semibold text-white">
              {formatCurrency(contract.contract_value, contract.value_currency)}
            </p>
            <p className="text-xs text-[#a1a1aa]">Contract value</p>
          </div>
          {signedUrl && (
            <a
              href={signedUrl}
              download={contract.file_name}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#a1a1aa]" />
            <span className="text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Health Score</span>
          </div>
          <p className={`text-3xl font-bold ${healthColour(contract.health_score)}`}>
            {contract.health_score ?? '—'}{contract.health_score !== null ? '/100' : ''}
          </p>
        </div>
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#a1a1aa]" />
            <span className="text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Risk Level</span>
          </div>
          {contract.risk_level ? (
            <span className={`inline-flex px-2.5 py-1 rounded-md text-sm font-medium border capitalize ${RISK_COLOUR[contract.risk_level]}`}>
              {contract.risk_level}
            </span>
          ) : (
            <p className="text-2xl font-bold text-[#a1a1aa]">—</p>
          )}
        </div>
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#a1a1aa]" />
            <span className="text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Importance</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {contract.importance_score ?? '—'}{contract.importance_score !== null ? '/10' : ''}
          </p>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* Left column — AI analysis */}
        <div className="lg:col-span-3 space-y-6">

          {contract.ai_summary && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Summary</h2>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">{contract.ai_summary}</p>
            </div>
          )}

          {(analysis?.risk_flags?.length ?? 0) > 0 && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Risk Flags</h2>
              <div className="space-y-3">
                {(analysis?.risk_flags ?? []).map((flag, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {SEVERITY_ICON[flag.severity]}
                    <p className="text-sm text-[#a1a1aa]">{flag.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {((analysis?.obligations_ours?.length ?? 0) > 0 || (analysis?.obligations_theirs?.length ?? 0) > 0) && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Obligations</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#a1a1aa] font-medium mb-2 uppercase tracking-wide">Ours</p>
                  <ul className="space-y-1.5">
                    {(analysis?.obligations_ours ?? []).map((o, i) => (
                      <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-1.5">
                        <span className="text-accent mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-[#a1a1aa] font-medium mb-2 uppercase tracking-wide">Theirs</p>
                  <ul className="space-y-1.5">
                    {(analysis?.obligations_theirs ?? []).map((o, i) => (
                      <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-1.5">
                        <span className="text-accent mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {(analysis?.cancellation_terms || analysis?.renewal_terms) && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5 space-y-4">
              {analysis?.cancellation_terms && (
                <div>
                  <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1.5">Cancellation</h3>
                  <p className="text-sm text-[#a1a1aa]">{analysis.cancellation_terms}</p>
                </div>
              )}
              {analysis?.renewal_terms && (
                <div>
                  <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1.5">Renewal</h3>
                  <p className="text-sm text-[#a1a1aa]">{analysis.renewal_terms}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface border border-[#27272a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a1a1aa]" /> Key Dates
            </h2>
            <div>
              {[
                { label: 'Start date', value: formatDate(contract.start_date) },
                { label: 'End date', value: formatDate(contract.end_date) },
                { label: 'Renewal date', value: formatDate(contract.renewal_date) },
                { label: 'Notice deadline', value: formatDate(contract.notice_deadline) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm py-2 border-b border-[#1a1a1a] last:border-0">
                  <span className="text-[#a1a1aa]">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
              {events.map(ev => (
                <div key={ev.id} className="flex justify-between text-sm py-2 border-b border-[#1a1a1a] last:border-0">
                  <span className="text-[#a1a1aa]">{ev.event_label}</span>
                  <span className="text-white">{formatDate(ev.event_date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — document viewer */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#a1a1aa]" /> Document
          </h2>
          <DocumentViewer signedUrl={signedUrl} fileName={contract.file_name} />
        </div>
      </div>

      {/* Negotiation Advisor — Coming Soon */}
      <div className="bg-surface border border-accent/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <Wand2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Negotiation Advisor</h2>
            <span className="text-xs text-accent font-medium">Coming Soon</span>
          </div>
        </div>
        <p className="text-sm text-[#a1a1aa] leading-relaxed ml-11">
          Get AI-powered negotiation recommendations specific to this contract — suggested clause improvements,
          red-line priorities, and leverage points based on your position.
        </p>
      </div>

      {/* Activity log */}
      <div className="bg-surface border border-[#27272a] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#a1a1aa]" /> Activity Log
        </h2>
        {activityItems.length === 0 ? (
          <p className="text-sm text-[#52525b]">No activity yet</p>
        ) : (
          <div>
            {activityItems.map(item => (
              <div key={item.id} className="flex items-start gap-4 py-3 border-b border-[#1a1a1a] last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  item.dot === 'accent' ? 'bg-accent' :
                  item.dot === 'amber' ? 'bg-amber-400' :
                  'bg-[#3f3f46]'
                }`} />
                <p className="flex-1 text-sm text-[#a1a1aa]">{item.label}</p>
                <span className="text-xs text-[#52525b] shrink-0 mt-0.5">
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
