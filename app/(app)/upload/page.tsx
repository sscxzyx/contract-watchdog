'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, Shield, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PlanTier } from '@/types/database'

type State =
  | { status: 'idle' }
  | { status: 'selected'; file: File }
  | { status: 'uploading'; file: File }
  | { status: 'analysing'; file: File; step: number }
  | { status: 'error'; message: string }

const ANALYSIS_STEPS = [
  'Uploading to secure storage…',
  'Extracting document text…',
  'Identifying key clauses…',
  'Assessing risk factors…',
  'Generating plain English summary…',
]

const ACCEPTED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const PLAN_LIMITS: Record<PlanTier, number | null> = {
  starter: 5,
  business: 25,
  agency: null,
}

const PLAN_LABEL: Record<PlanTier, string> = {
  starter: 'Starter',
  business: 'Business',
  agency: 'Agency',
}

// ─── upgrade modal ────────────────────────────────────────────────────────────

function UpgradeModal({ currentPlan, contractCount, onClose }: {
  currentPlan: PlanTier
  contractCount: number
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-[#27272a] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-amber-400/10">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Contract limit reached</h2>
            <p className="text-xs text-[#a1a1aa]">
              You have {contractCount} contract{contractCount !== 1 ? 's' : ''} on the {PLAN_LABEL[currentPlan]} plan
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-[#52525b] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {([
            { tier: 'starter', label: 'Starter', price: 'Free', limit: '5 contracts' },
            { tier: 'business', label: 'Business', price: '£19/mo', limit: '25 contracts' },
            { tier: 'agency', label: 'Agency', price: 'A$190/mo', limit: 'Unlimited + 50GB' },
          ] as const).map(plan => (
            <div
              key={plan.tier}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                plan.tier === currentPlan
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-[#27272a] bg-[#0a0a0a]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{plan.label}</span>
                  {plan.tier === currentPlan && (
                    <span className="text-xs text-accent">Current</span>
                  )}
                </div>
                <p className="text-xs text-[#a1a1aa]">{plan.limit}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{plan.price}</p>
                {plan.tier !== currentPlan && plan.tier !== 'starter' && (
                  <p className="text-xs text-[#52525b]">coming soon</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#a1a1aa] text-center">
          Stripe billing is coming soon. <a href="/settings" className="text-accent hover:underline">View billing settings</a>
        </p>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ status: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const [limitModal, setLimitModal] = useState<{ plan: PlanTier; count: number } | null>(null)

  const validateAndSelect = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setState({ status: 'error', message: 'Only PDF and DOCX files are supported.' })
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setState({ status: 'error', message: 'File must be under 25 MB.' })
      return
    }
    setState({ status: 'selected', file })
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }

  async function handleAnalyse() {
    if (state.status !== 'selected') return
    const { file } = state
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setState({ status: 'error', message: 'You must be signed in to upload.' })
      return
    }

    // Tier enforcement: check contract count vs plan limit
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from('users').select('plan_tier').eq('id', user.id).single(),
      supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    const planTier = ((profile?.plan_tier as PlanTier | undefined) ?? 'starter') as PlanTier
    const limit = PLAN_LIMITS[planTier]
    const contractCount = count ?? 0

    if (limit !== null && contractCount >= limit) {
      setLimitModal({ plan: planTier, count: contractCount })
      return
    }

    // Upload to Supabase Storage
    setState({ status: 'uploading', file })
    const filePath = `${user.id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file, { contentType: file.type })

    if (uploadError) {
      setState({ status: 'error', message: 'Upload failed — please check your connection and try again.' })
      return
    }

    // Animate analysis steps while API processes
    setState({ status: 'analysing', file, step: 0 })
    let step = 0
    const timer = setInterval(() => {
      step = Math.min(step + 1, ANALYSIS_STEPS.length - 1)
      setState({ status: 'analysing', file, step })
    }, 4000)

    const response = await fetch('/api/contracts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, fileName: file.name }),
    })

    clearInterval(timer)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setState({ status: 'error', message: (body as { error?: string }).error ?? 'Analysis failed — please try again.' })
      return
    }

    const { contractId } = await response.json() as { contractId: string }
    router.push(`/contracts/${contractId}`)
  }

  // ── Analysing screen ──────────────────────────────────────────────────────
  if (state.status === 'analysing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 animate-pulse">
          <Shield className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Analysing your contract…</h2>
        <p className="text-[#a1a1aa] text-sm mb-8">This usually takes 15–30 seconds</p>
        <div className="w-full max-w-xs space-y-3 text-left">
          {ANALYSIS_STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < state.step ? (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              ) : i === state.step ? (
                <Loader2 className="w-4 h-4 text-accent shrink-0 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#27272a] shrink-0" />
              )}
              <span className={`text-sm ${i <= state.step ? 'text-white' : 'text-[#52525b]'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Main upload UI ────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl">
      {limitModal && (
        <UpgradeModal
          currentPlan={limitModal.plan}
          contractCount={limitModal.count}
          onClose={() => setLimitModal(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Upload Contract</h1>
        <p className="text-[#a1a1aa] mt-1 text-sm">PDF or DOCX — up to 25 MB</p>
      </div>

      {state.status === 'error' && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{state.message}</p>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => state.status !== 'uploading' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-accent bg-accent/5'
            : state.status === 'selected'
            ? 'border-[#3f3f46] bg-[#111111]'
            : 'border-[#27272a] hover:border-[#3f3f46] bg-[#111111]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSelect(f) }}
        />

        {state.status === 'selected' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{state.file.name}</p>
              <p className="text-[#a1a1aa] text-xs mt-0.5">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setState({ status: 'idle' }) }}
              className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        ) : state.status === 'uploading' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-white text-sm font-medium">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#a1a1aa]" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Drop your contract here</p>
              <p className="text-[#a1a1aa] text-xs mt-1">or click to browse — PDF or DOCX, max 25 MB</p>
            </div>
          </div>
        )}
      </div>

      {state.status === 'selected' && (
        <button
          onClick={handleAnalyse}
          className="mt-4 w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Analyse Contract
        </button>
      )}
    </div>
  )
}
