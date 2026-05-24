'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, Check, ArrowRight, ArrowLeft,
  Loader2, Star, Zap, Building2, FileText, Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildPersonalisationContext } from '@/lib/utils/personalisation'
import type { PlanTier, BusinessType, ContractVolume, NotificationPref } from '@/types/database'

// ─── constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Choose plan', 'Your business', 'Your contracts', 'Notifications']

const PLAN_MONTHLY: Record<PlanTier, number> = { starter: 29, business: 59, agency: 190 }
const PLAN_ANNUAL: Record<PlanTier, number> = { starter: 23, business: 47, agency: 152 }

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'sole_trader', label: 'Sole Trader' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'company', label: 'Company' },
  { value: 'trust', label: 'Trust' },
]

const INDUSTRIES = [
  'Construction/Trades', 'Hospitality/Café/Restaurant', 'Retail',
  'Professional Services', 'Healthcare', 'Real Estate',
  'Transport/Logistics', 'Creative/Marketing', 'Technology', 'Other',
]

const CONTRACT_VOLUMES: { value: ContractVolume; label: string }[] = [
  { value: '1-5', label: '1–5' },
  { value: '5-20', label: '5–20' },
  { value: '20-50', label: '20–50' },
  { value: '50+', label: '50+' },
]

const CONTRACT_TYPE_OPTIONS = [
  'Commercial Lease', 'Supplier Agreements', 'Client Contracts',
  'Employment Contracts', 'Subcontractor Agreements', 'Equipment Leases',
  'Service Agreements', 'Partnership Agreements',
]

const HEADACHE_OPTIONS = [
  'Missing renewal deadlines', 'Understanding legal language',
  'Tracking obligations', 'Managing multiple contracts', 'Spotting risky clauses',
]

const CAUGHT_OUT_OPTIONS = [
  { value: 'yes_costly', label: 'Yes, it cost me money' },
  { value: 'yes_caught', label: 'Yes, but caught it in time' },
  { value: 'not_yet', label: 'Not yet, but worried' },
  { value: 'no_never', label: 'No, never' },
]

const NOTIFICATION_PREFS: { value: NotificationPref; label: string; desc: string }[] = [
  { value: 'email_only', label: 'Email only', desc: 'Alerts sent to your inbox' },
  { value: 'email_sms', label: 'Email + SMS', desc: 'Email and text message alerts' },
  { value: 'in_app_only', label: 'In-app only', desc: 'Dashboard notifications only' },
]

const ALERT_DAYS_OPTIONS = [90, 60, 30, 14, 7, 1]

// ─── progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-start">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              i < current ? 'bg-green-500 text-white'
              : i === current ? 'bg-accent text-white ring-4 ring-accent/20'
              : 'bg-[#1a1a1a] border border-[#27272a] text-[#52525b]'
            }`}>
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1.5 font-medium hidden sm:block text-center ${
              i === current ? 'text-white' : 'text-[#52525b]'
            }`}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-14 sm:w-20 h-px mt-4 transition-all duration-300 ${
              i < current ? 'bg-green-500/50' : 'bg-[#27272a]'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, price, annual, isPopular, features, onSelect, saving }: {
  plan: PlanTier
  price: number
  annual: boolean
  isPopular?: boolean
  features: string[]
  onSelect: () => void
  saving: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col rounded-2xl p-6 border transition-all cursor-pointer ${
        isPopular
          ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
          : 'border-[#27272a] bg-surface hover:border-[#3f3f46]'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
            <Star className="w-3 h-3 fill-white" /> Most Popular
          </span>
        </div>
      )}

      <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full self-start">
        <Zap className="w-3 h-3 text-green-400" />
        <span className="text-xs text-green-400 font-medium whitespace-nowrap">First contract free</span>
      </div>

      <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest mb-1">
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </p>

      <div className="flex items-end gap-1.5 mb-1">
        <span className="text-4xl font-bold text-white">A${price}</span>
        <span className="text-[#a1a1aa] text-sm mb-1.5">/mo</span>
      </div>

      {annual ? (
        <p className="text-xs text-green-400 mb-5">Billed annually · 20% off</p>
      ) : (
        <p className="text-xs text-[#52525b] mb-5">Billed monthly</p>
      )}

      <div className="space-y-2.5 flex-1 mb-6">
        {features.map(f => (
          <div key={f} className="flex items-start gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isPopular ? 'bg-accent/20' : 'bg-[#1a1a1a]'
            }`}>
              <Check className={`w-2.5 h-2.5 ${isPopular ? 'text-accent' : 'text-[#a1a1aa]'}`} />
            </div>
            <span className="text-sm text-[#a1a1aa] leading-snug">{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        disabled={saving}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
          isPopular
            ? 'bg-accent hover:bg-accent-hover text-white'
            : 'bg-[#1a1a1a] hover:bg-[#27272a] border border-[#27272a] text-white'
        }`}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? 'Saving…' : 'Get started'}
      </button>
    </div>
  )
}

// ─── shared styles ────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-[#1a1a1a] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors'
const selectCls = `${inputCls} appearance-none`

// ─── main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [initialising, setInitialising] = useState(true)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 0 — Plan
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('business')

  // Step 1 — Business basics
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType | ''>('')
  const [industry, setIndustry] = useState('')
  const [contractVolume, setContractVolume] = useState<ContractVolume | ''>('')

  // Step 2 — Contract context
  const [contractTypes, setContractTypes] = useState<string[]>([])
  const [headache, setHeadache] = useState('')
  const [caughtOut, setCaughtOut] = useState('')

  // Step 3 — Notifications
  const [notifPref, setNotifPref] = useState<NotificationPref>('email_only')
  const [alertDays, setAlertDays] = useState<number[]>([90, 60, 30, 14, 7])
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      ])

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name)
        if (profile.company_name) setBusinessName(profile.company_name)
        if (profile.business_type) setBusinessType(profile.business_type as BusinessType)
        if (profile.industry) setIndustry(profile.industry)
        if (profile.contract_volume) setContractVolume(profile.contract_volume as ContractVolume)
        if (profile.contract_types?.length) setContractTypes(profile.contract_types)
        if (profile.biggest_headache) setHeadache(profile.biggest_headache)
        if (profile.caught_out) setCaughtOut(profile.caught_out)
        if (profile.plan_tier) setSelectedPlan(profile.plan_tier as PlanTier)
      }

      if (settings) {
        if (settings.notification_preference) setNotifPref(settings.notification_preference as NotificationPref)
        if (settings.alert_days_before?.length) setAlertDays(settings.alert_days_before)
        if (settings.phone_number) setPhoneNumber(settings.phone_number)
      }

      setInitialising(false)
    }
    init()
  }, [router])

  async function handleSkip() {
    router.push('/dashboard')
  }

  // ── Step 0 ────────────────────────────────────────────────────────────────
  async function selectPlan(plan: PlanTier) {
    if (!userId || saving) return
    setSelectedPlan(plan)
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({ plan_tier: plan }).eq('id', userId)
    setSaving(false)
    setStep(1)
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  async function saveStep1() {
    if (!userId || saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({
      full_name: fullName.trim() || null,
      company_name: businessName.trim() || null,
      business_type: businessType || null,
      industry: industry || null,
      contract_volume: contractVolume || null,
    }).eq('id', userId)
    setSaving(false)
    setStep(2)
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────
  async function saveStep2() {
    if (!userId || saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({
      contract_types: contractTypes,
      biggest_headache: headache || null,
      caught_out: caughtOut || null,
    }).eq('id', userId)
    setSaving(false)
    setStep(3)
  }

  // ── Step 3 ────────────────────────────────────────────────────────────────
  async function saveStep3() {
    if (!userId || saving) return
    setSaving(true)

    const personalisationContext = buildPersonalisationContext({
      businessType: businessType as string,
      industry,
      contractTypes,
      biggestHeadache: headache,
      contractVolume: contractVolume as string,
    })

    const supabase = createClient()
    await Promise.all([
      supabase.from('users').update({
        personalisation_context: personalisationContext || null,
        onboarding_complete: true,
      }).eq('id', userId),
      supabase.from('user_settings').update({
        notification_preference: notifPref,
        alert_days_before: [...alertDays].sort((a, b) => b - a),
        phone_number: phoneNumber.trim() || null,
      }).eq('user_id', userId),
    ])

    setSaving(false)
    router.push('/dashboard')
  }

  function toggleContractType(t: string) {
    setContractTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function toggleAlertDay(d: number) {
    setAlertDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (initialising) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-[#111111]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">Controva</span>
        </div>
        {step > 0 && (
          <button
            onClick={handleSkip}
            className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center pt-10 pb-20 px-4">

        {/* Progress */}
        <div className="mb-10 w-full max-w-md">
          <ProgressBar current={step} />
        </div>

        {/* ── Step 0: Pricing ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Choose your plan</h1>
              <p className="text-[#a1a1aa]">Start with your first contract free — no card required</p>
            </div>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-white' : 'text-[#52525b]'}`}>Monthly</span>
              <button
                onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billing === 'annual' ? 'bg-accent' : 'bg-[#27272a]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${billing === 'annual' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium flex items-center gap-2 ${billing === 'annual' ? 'text-white' : 'text-[#52525b]'}`}>
                Annual
                <span className="text-xs text-green-400 font-semibold bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <PlanCard
                plan="starter"
                price={billing === 'annual' ? PLAN_ANNUAL.starter : PLAN_MONTHLY.starter}
                annual={billing === 'annual'}
                features={['Up to 5 contracts', 'AI contract analysis', 'Email alerts', 'Plain English summaries', '1 user']}
                onSelect={() => selectPlan('starter')}
                saving={saving && selectedPlan === 'starter'}
              />
              <PlanCard
                plan="business"
                price={billing === 'annual' ? PLAN_ANNUAL.business : PLAN_MONTHLY.business}
                annual={billing === 'annual'}
                isPopular
                features={['Up to 25 contracts', 'AI contract analysis', 'Email + SMS alerts', 'Risk scoring and flags', '90 day advance warnings', '3 users']}
                onSelect={() => selectPlan('business')}
                saving={saving && selectedPlan === 'business'}
              />
              <PlanCard
                plan="agency"
                price={billing === 'annual' ? PLAN_ANNUAL.agency : PLAN_MONTHLY.agency}
                annual={billing === 'annual'}
                features={['Unlimited contracts', '50GB document storage', 'Everything in Business', 'White label ready', 'API access', 'Unlimited users', 'Priority support']}
                onSelect={() => selectPlan('agency')}
                saving={saving && selectedPlan === 'agency'}
              />
            </div>

            <p className="text-center text-xs text-[#52525b] mt-8">
              Stripe billing coming soon. Plans are recorded but payment is not yet processed.
            </p>
          </div>
        )}

        {/* ── Step 1: Business Basics ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Tell us about your business</h1>
              <p className="text-[#a1a1aa] text-sm">This helps us personalise your AI contract analysis</p>
            </div>

            <div className="bg-surface border border-[#27272a] rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 uppercase tracking-wide">Full name</label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 uppercase tracking-wide">Business name</label>
                <input
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Acme Pty Ltd"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 uppercase tracking-wide">Business type</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value as BusinessType)}
                    className={selectCls}
                  >
                    <option value="">Select...</option>
                    {BUSINESS_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 uppercase tracking-wide">Industry</label>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select...</option>
                    {INDUSTRIES.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">
                  How many contracts do you manage?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CONTRACT_VOLUMES.map(v => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setContractVolume(v.value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        contractVolume === v.value
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={saveStep1}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving…' : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Contract Context ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">About your contracts</h1>
              <p className="text-[#a1a1aa] text-sm">We'll use this to give you more relevant analysis</p>
            </div>

            <div className="bg-surface border border-[#27272a] rounded-2xl p-6 space-y-6">
              {/* Contract types */}
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">
                  What types of contracts do you mainly deal with?
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_TYPE_OPTIONS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleContractType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        contractTypes.includes(t)
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                      }`}
                    >
                      {contractTypes.includes(t) && '✓ '}{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Biggest headache */}
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">
                  What's your biggest contract headache?
                </label>
                <div className="space-y-2">
                  {HEADACHE_OPTIONS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHeadache(h)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                        headache === h
                          ? 'bg-accent/10 text-white border-accent/30'
                          : 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caught out */}
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">
                  Have you ever been caught out by a contract clause?
                </label>
                <div className="space-y-2">
                  {CAUGHT_OUT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setCaughtOut(o.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                        caughtOut === o.value
                          ? 'bg-accent/10 text-white border-accent/30'
                          : 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={saveStep2}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving…' : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Notifications ────────────────────────────────────────── */}
        {step === 3 && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                <Bell className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Stay on top of deadlines</h1>
              <p className="text-[#a1a1aa] text-sm">Set up how you want to be alerted</p>
            </div>

            <div className="bg-surface border border-[#27272a] rounded-2xl p-6 space-y-6">
              {/* Notification method */}
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">
                  How do you want to be alerted?
                </label>
                <div className="space-y-2">
                  {NOTIFICATION_PREFS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setNotifPref(p.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm border transition-colors ${
                        notifPref === p.value
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-[#1a1a1a] border-[#27272a] hover:border-[#3f3f46]'
                      }`}
                    >
                      <div className="text-left">
                        <p className={`font-medium ${notifPref === p.value ? 'text-white' : 'text-[#a1a1aa]'}`}>{p.label}</p>
                        <p className="text-xs text-[#52525b] mt-0.5">{p.desc}</p>
                      </div>
                      {notifPref === p.value && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number — only if SMS selected */}
              {notifPref === 'email_sms' && (
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-2 uppercase tracking-wide">
                    Phone number <span className="text-[#52525b] normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+61 400 000 000"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Alert days */}
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">
                  How far in advance do you want warnings?
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALERT_DAYS_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleAlertDay(d)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        alertDays.includes(d)
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : 'bg-[#1a1a1a] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                      }`}
                    >
                      {d === 1 ? '1 day' : `${d} days`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={saveStep3}
                  disabled={saving || alertDays.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
                  ) : (
                    <><Check className="w-4 h-4" /> Complete setup</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
