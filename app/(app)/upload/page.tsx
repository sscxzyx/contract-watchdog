'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, Shield, CheckCircle, AlertCircle, Loader2, Zap, Clock } from 'lucide-react'
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
  free: 1,
  starter: 15,
  business: 30,
  agency: null,
}

const PLAN_LABEL: Record<PlanTier, string> = {
  free: 'Free',
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
  const [loading, setLoading] = useState<string | null>(null)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  async function upgrade(plan: PlanTier) {
    setLoading(plan)
    setUpgradeError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const body = await res.json()
      if (body.url) {
        window.location.href = body.url
      } else {
        setUpgradeError(body.error ?? 'Something went wrong — please try again.')
        setLoading(null)
      }
    } catch {
      setUpgradeError('Network error — please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="border border-border bg-[#171A21] rounded-2xl p-6 max-w-md w-full mx-4 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/15 border border-warning/20">
            <Zap className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold text-lg">Contract limit reached</h2>
            <p className="text-xs text-muted-foreground">
              You have {contractCount} contract{contractCount !== 1 ? 's' : ''} on the {PLAN_LABEL[currentPlan]} plan
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-muted-foreground/60 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {upgradeError && (
          <p className="mb-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{upgradeError}</p>
        )}

        <div className="space-y-2 mb-4">
          {([
            { tier: 'free' as const, label: 'Free', price: 'A$0', limit: '1 contract · 1 scan/month' },
            { tier: 'starter' as const, label: 'Starter', price: 'A$29/mo', limit: '15 contracts · 14-day trial' },
            { tier: 'business' as const, label: 'Business', price: 'A$59/mo', limit: '30 contracts · 14-day trial' },
            { tier: 'agency' as const, label: 'Agency', price: 'A$190/mo', limit: 'Unlimited + 50GB' },
          ]).map(plan => (
            <div
              key={plan.tier}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                plan.tier === currentPlan
                  ? 'border-primary/30 bg-primary/[0.06] shadow-glow-soft'
                  : 'border-border bg-surface-2/40'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{plan.label}</span>
                  {plan.tier === currentPlan && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Current</span>}
                </div>
                <p className="text-xs text-muted-foreground">{plan.limit}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <p className="text-sm font-semibold text-foreground">{plan.price}</p>
                {plan.tier !== currentPlan && plan.tier !== 'free' && (
                  <button
                    onClick={() => upgrade(plan.tier)}
                    disabled={loading !== null}
                    className="px-3 py-1.5 rounded-lg bg-gold hover:bg-gold/90 disabled:opacity-50 text-[#0F1115] text-xs font-medium shadow-glow-soft transition-all flex items-center gap-1.5"
                  >
                    {loading === plan.tier && <Loader2 className="w-3 h-3 animate-spin" />}
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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
      supabase.from('users').select('plan_tier, free_scan_reset_at').eq('id', user.id).single(),
      supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    const planTier = ((profile?.plan_tier as PlanTier | undefined) ?? 'free') as PlanTier
    const limit = PLAN_LIMITS[planTier]
    const contractCount = count ?? 0

    if (limit !== null && contractCount >= limit) {
      setLimitModal({ plan: planTier, count: contractCount })
      return
    }

    // Free tier: enforce 1 scan per 30 days
    if (planTier === 'free' && profile?.free_scan_reset_at) {
      const daysSince = (Date.now() - new Date(profile.free_scan_reset_at).getTime()) / 86400000
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince)
        setState({
          status: 'error',
          message: `Your free scan resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to scan anytime.`,
        })
        return
      }
    }

    // Upload to Supabase Storage. Storage object keys reject many characters
    // (unicode, #, ?, etc.) — keep the original name for display but use a
    // sanitised key so uploads don't fail on unusual filenames.
    setState({ status: 'uploading', file })
    const safeName = file.name.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, '_').slice(-100)
    const filePath = `${user.id}/${Date.now()}_${safeName}`

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

    try {
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

      // Note: free-tier scan window is recorded server-side in the analyze route.

      router.push(`/contracts/${contractId}`)
    } catch {
      clearInterval(timer)
      setState({ status: 'error', message: 'Connection lost during analysis — please check your internet and try again.' })
    }
  }

  // ── Analysing screen ──────────────────────────────────────────────────────
  if (state.status === 'analysing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-glow animate-breathe">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Analysing your contract…</h2>
        <p className="text-muted-foreground text-sm mb-8">This usually takes 15–30 seconds</p>
        <div className="relative w-full max-w-xs rounded-xl border border-primary/20 bg-surface-2/40 p-5 overflow-hidden">
          <div className="scan-line" />
          <div className="space-y-3 text-left">
            {ANALYSIS_STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < state.step ? (
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                ) : i === state.step ? (
                  <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                )}
                <span className={`text-sm ${i <= state.step ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
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
        <p className="text-xs text-muted-foreground">New analysis</p>
        <h1 className="text-2xl font-semibold text-foreground mt-0.5">Upload Contract</h1>
        <p className="text-muted-foreground mt-1 text-sm">PDF or DOCX — up to 25 MB</p>
      </div>

      {state.status === 'error' && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-danger text-sm">{state.message}</p>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => state.status !== 'uploading' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary bg-primary/[0.06] shadow-glow-soft'
            : state.status === 'selected'
            ? 'border-primary/30 bg-surface-2/40'
            : 'border-border hover:border-primary/30 bg-surface-2/40'
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
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-glow-soft">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium text-sm">{state.file.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setState({ status: 'idle' }) }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        ) : state.status === 'uploading' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-foreground text-sm font-medium">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Drop your contract here</p>
              <p className="text-muted-foreground text-xs mt-1">or click to browse — PDF or DOCX, max 25 MB</p>
            </div>
          </div>
        )}
      </div>

      {state.status === 'selected' && (
        <button
          onClick={handleAnalyse}
          className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground shadow-glow hover:bg-primary/90 hover:scale-[1.01] transition-all shine flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Analyse Contract
        </button>
      )}
    </div>
  )
}
