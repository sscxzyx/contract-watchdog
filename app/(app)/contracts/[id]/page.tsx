import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, AlertTriangle, CheckCircle, Info,
  Calendar, DollarSign, Shield, Activity
} from 'lucide-react'
import type { Contract } from '@/types/database'
import type { RiskLevel } from '@/types/database'

const riskColour: Record<RiskLevel, string> = {
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const severityIcon = {
  low: <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />,
  medium: <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
  high: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
}

function healthColour(score: number | null) {
  if (score === null) return 'text-[#a1a1aa]'
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function statusBadge(status: Contract['status']) {
  const map = {
    active: 'bg-green-400/10 text-green-400 border-green-400/20',
    expiring_soon: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    expired: 'bg-red-400/10 text-red-400 border-red-400/20',
    needs_review: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  }
  const label = {
    active: 'Active',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    needs_review: 'Needs Review',
  }
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${map[status]}`}>
      {label[status]}
    </span>
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(value: number | null, currency: string | null) {
  if (value === null) return 'Value not specified'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency ?? 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!contract) notFound()

  const { data: events } = await supabase
    .from('contract_events')
    .select('*')
    .eq('contract_id', params.id)
    .order('event_date', { ascending: true })

  const analysis = contract.ai_analysis_json

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link
        href="/vault"
        className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Vault
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-white">{contract.contract_name}</h1>
            {statusBadge(contract.status)}
          </div>
          <p className="text-[#a1a1aa] text-sm">
            {contract.counterparty_name ?? 'Counterparty unknown'} · {contract.contract_type ?? 'Unknown type'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-white">
            {formatCurrency(contract.contract_value, contract.value_currency)}
          </p>
          <p className="text-xs text-[#a1a1aa] mt-0.5">Contract value</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Health score */}
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#a1a1aa]" />
            <span className="text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Health Score</span>
          </div>
          <p className={`text-3xl font-bold ${healthColour(contract.health_score)}`}>
            {contract.health_score ?? '—'}{contract.health_score !== null ? '/100' : ''}
          </p>
        </div>

        {/* Risk level */}
        <div className="bg-surface border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#a1a1aa]" />
            <span className="text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Risk Level</span>
          </div>
          {contract.risk_level ? (
            <span className={`inline-flex px-2.5 py-1 rounded-md text-sm font-medium border capitalize ${riskColour[contract.risk_level as RiskLevel]}`}>
              {contract.risk_level}
            </span>
          ) : (
            <p className="text-[#a1a1aa]">—</p>
          )}
        </div>

        {/* Importance */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* AI Summary */}
          {contract.ai_summary && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Summary</h2>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">{contract.ai_summary}</p>
            </div>
          )}

          {/* Risk flags */}
          {analysis?.risk_flags?.length > 0 && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Risk Flags</h2>
              <div className="space-y-3">
                {analysis.risk_flags.map((flag: { severity: string; description: string }, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    {severityIcon[flag.severity as RiskLevel]}
                    <p className="text-sm text-[#a1a1aa]">{flag.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Obligations */}
          {(analysis?.obligations_ours?.length > 0 || analysis?.obligations_theirs?.length > 0) && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Obligations</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#a1a1aa] font-medium mb-2 uppercase tracking-wide">Ours</p>
                  <ul className="space-y-1.5">
                    {(analysis.obligations_ours ?? []).map((o: string, i: number) => (
                      <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-1.5">
                        <span className="text-accent mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-[#a1a1aa] font-medium mb-2 uppercase tracking-wide">Theirs</p>
                  <ul className="space-y-1.5">
                    {(analysis.obligations_theirs ?? []).map((o: string, i: number) => (
                      <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-1.5">
                        <span className="text-accent mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Key dates */}
          <div className="bg-surface border border-[#27272a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a1a1aa]" /> Key Dates
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Start date', value: formatDate(contract.start_date) },
                { label: 'End date', value: formatDate(contract.end_date) },
                { label: 'Renewal date', value: formatDate(contract.renewal_date) },
                { label: 'Notice deadline', value: formatDate(contract.notice_deadline) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm py-1.5 border-b border-[#1a1a1a] last:border-0">
                  <span className="text-[#a1a1aa]">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
              {(events ?? []).map(ev => (
                <div key={ev.id} className="flex justify-between text-sm py-1.5 border-b border-[#1a1a1a] last:border-0">
                  <span className="text-[#a1a1aa]">{ev.event_label}</span>
                  <span className="text-white">{formatDate(ev.event_date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation & renewal terms */}
          {(analysis?.cancellation_terms || analysis?.renewal_terms) && (
            <div className="bg-surface border border-[#27272a] rounded-xl p-5 space-y-4">
              {analysis.cancellation_terms && (
                <div>
                  <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1.5">Cancellation</h3>
                  <p className="text-sm text-[#a1a1aa]">{analysis.cancellation_terms}</p>
                </div>
              )}
              {analysis.renewal_terms && (
                <div>
                  <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1.5">Renewal</h3>
                  <p className="text-sm text-[#a1a1aa]">{analysis.renewal_terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
