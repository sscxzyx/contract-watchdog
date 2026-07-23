'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Bell, CreditCard, Shield, Check,
  Loader2, Plus, X, AlertTriangle, LogOut, Briefcase,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildPersonalisationContext } from '@/lib/utils/personalisation'
import type { User as UserType, UserSettings, PlanTier } from '@/types/database'

// ─── constants ────────────────────────────────────────────────────────────────

const ALERT_DAY_OPTIONS = [7, 14, 30, 60, 90]

const INDUSTRIES = [
  'Construction/Trades', 'Hospitality/Café/Restaurant', 'Retail',
  'Professional Services', 'Healthcare', 'Real Estate',
  'Transport/Logistics', 'Creative/Marketing', 'Technology', 'Other',
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

const NAV_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'account', label: 'Account', icon: Shield },
] as const

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

const PLAN_COLOUR: Record<PlanTier, string> = {
  free: 'text-muted-foreground bg-surface-2/60 border-border',
  starter: 'text-primary bg-primary/10 border-primary/20',
  business: 'text-warning bg-warning/15 border-warning/20',
  agency: 'text-success bg-success/15 border-success/20',
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({ id, title, icon: Icon, children }: {
  id: string
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div id={id} className="rounded-xl border border-border bg-surface-2/40 p-6 scroll-mt-20">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border/60">
        <div className="size-7 rounded-md bg-primary/10 border border-primary/20 grid place-items-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── save banner ──────────────────────────────────────────────────────────────

function SaveBanner({ saved, error }: { saved: boolean; error: string | null }) {
  if (error) {
    return (
      <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
        <AlertTriangle className="w-4 h-4" /> {error}
      </div>
    )
  }
  if (!saved) return null
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/20 text-success text-sm font-medium rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
      <Check className="w-4 h-4" /> Changes saved
    </div>
  )
}

// ─── delete account modal ─────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const [confirm, setConfirm] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl border border-border bg-[#0e0e10] p-6 max-w-sm w-full mx-4 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-danger/10">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <h2 className="text-foreground font-semibold text-lg">Delete account</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          This will permanently delete your account and all contracts. This cannot be undone.
        </p>
        <p className="text-muted-foreground text-sm mb-2">Type <span className="text-foreground font-mono">delete</span> to confirm:</p>
        <input
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-danger/50 mb-4 transition-colors"
          placeholder="delete"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || confirm !== 'delete'}
            className="flex-1 px-4 py-2.5 rounded-lg bg-danger hover:bg-danger/90 text-foreground text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</> : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── billing section ─────────────────────────────────────────────────────────

const PLANS = [
  { tier: 'free' as const, label: 'Free', price: 'A$0', limit: '1 contract · 1 scan/month', features: ['AI analysis', 'Plain English summary', 'Risk flags'] },
  { tier: 'starter' as const, label: 'Starter', price: 'A$29/mo', limit: '15 contracts', features: ['Everything in Free', 'Vault access', 'Email alerts', '14-day free trial'] },
  { tier: 'business' as const, label: 'Business', price: 'A$59/mo', limit: '30 contracts', features: ['Everything in Starter', 'Email + SMS alerts', '14-day free trial'] },
  { tier: 'agency' as const, label: 'Agency', price: 'A$190/mo', limit: 'Unlimited + 50GB', features: ['Everything in Business', 'White label ready', 'API access'] },
]

function BillingSection({ planTier, contractLimit, hasStripeCustomer }: {
  planTier: PlanTier
  contractLimit: number | null
  hasStripeCustomer: boolean
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  async function upgrade(plan: PlanTier) {
    setLoadingPlan(plan)
    setBillingError(null)
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
        setBillingError(body.error ?? 'Something went wrong — please try again.')
        setLoadingPlan(null)
      }
    } catch {
      setBillingError('Network error — please try again.')
      setLoadingPlan(null)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    setBillingError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const body = await res.json()
      if (body.url) {
        window.location.href = body.url
      } else {
        setBillingError(body.error ?? 'Could not open the billing portal — please try again.')
        setPortalLoading(false)
      }
    } catch {
      setBillingError('Network error — please try again.')
      setPortalLoading(false)
    }
  }

  return (
    <Section id="billing" title="Billing" icon={CreditCard}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-surface-2/60 rounded-xl border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Current plan</p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${PLAN_COLOUR[planTier]}`}>
                {PLAN_LABEL[planTier]}
              </span>
              <span className="text-sm text-muted-foreground">
                {contractLimit !== null ? `${contractLimit} contracts` : 'Unlimited contracts'}
              </span>
            </div>
          </div>
          {hasStripeCustomer && planTier !== 'free' && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 text-xs transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Manage billing
            </button>
          )}
        </div>

        {billingError && (
          <p className="mb-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{billingError}</p>
        )}

        <div className="space-y-2">
          {PLANS.map(plan => (
            <div
              key={plan.tier}
              className={`p-4 rounded-xl border ${plan.tier === planTier ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-2/30'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{plan.label}</span>
                  {plan.tier === planTier && <span className="text-xs text-primary font-medium">Current</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{plan.price}</span>
                  {plan.tier !== planTier && plan.tier !== 'free' && (
                    <button
                      onClick={() => upgrade(plan.tier)}
                      disabled={loadingPlan !== null}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 shadow-glow-soft disabled:opacity-50 text-foreground text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      {loadingPlan === plan.tier && <Loader2 className="w-3 h-3 animate-spin" />}
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{plan.limit}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {plan.features.map(f => (
                  <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="w-3 h-3 text-success shrink-0" />{f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  authEmail: string
  profile: UserType | null
  settings: UserSettings | null
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SettingsClient({ userId, authEmail, profile, settings }: Props) {
  const router = useRouter()

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [company, setCompany] = useState(profile?.company_name ?? '')
  const [industry, setIndustry] = useState(profile?.industry ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Notifications state
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(settings?.email_alerts_enabled ?? true)
  const [alertDays, setAlertDays] = useState<number[]>(settings?.alert_days_before ?? [90, 60, 30, 14, 7])
  const [extraRecipients, setExtraRecipients] = useState<string[]>(settings?.extra_recipients ?? [])
  const [newRecipient, setNewRecipient] = useState('')
  const [savingNotifs, setSavingNotifs] = useState(false)

  // Business profile state
  const [bizType, setBizType] = useState(profile?.business_type ?? '')
  const [contractVol, setContractVol] = useState(profile?.contract_volume ?? '')
  const [bizContractTypes, setBizContractTypes] = useState<string[]>(profile?.contract_types ?? [])
  const [bizHeadache, setBizHeadache] = useState(profile?.biggest_headache ?? '')
  const [bizCaughtOut, setBizCaughtOut] = useState(profile?.caught_out ?? '')
  const [savingBusiness, setSavingBusiness] = useState(false)

  // Notification preference state
  const [notifPref, setNotifPref] = useState(settings?.notification_preference ?? 'email_only')
  const [phoneNumber, setPhoneNumber] = useState(settings?.phone_number ?? '')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Saved flash
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  function flashSaved() {
    setSaveError(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }
  function flashError(message: string) {
    setSaveError(message)
    setTimeout(() => setSaveError(null), 4000)
  }

  const planTier = (profile?.plan_tier ?? 'free') as PlanTier
  const contractLimit = PLAN_LIMITS[planTier]

  const [activeSection, setActiveSection] = useState('profile')

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const ids = ['profile', 'business', 'notifications', 'billing', 'account']
    function onScroll() {
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id)
          return
        }
      }
      setActiveSection('profile')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── save profile ────────────────────────────────────────────────────────────
  async function saveProfile() {
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase.from('users').update({
      full_name: fullName.trim() || null,
      company_name: company.trim() || null,
      industry: industry.trim() || null,
    }).eq('id', userId)
    setSavingProfile(false)
    if (error) flashError('Could not save your profile — please try again.')
    else flashSaved()
  }

  // ── save business profile ───────────────────────────────────────────────────
  async function saveBusinessProfile() {
    setSavingBusiness(true)
    const supabase = createClient()
    const personalisationContext = buildPersonalisationContext({
      businessType: bizType,
      industry,
      contractTypes: bizContractTypes,
      biggestHeadache: bizHeadache,
      contractVolume: contractVol,
    })
    const { error } = await supabase.from('users').update({
      business_type: bizType || null,
      contract_volume: contractVol || null,
      contract_types: bizContractTypes,
      biggest_headache: bizHeadache || null,
      caught_out: bizCaughtOut || null,
      personalisation_context: personalisationContext || null,
    }).eq('id', userId)
    setSavingBusiness(false)
    if (error) flashError('Could not save your business profile — please try again.')
    else flashSaved()
  }

  // ── save notifications ──────────────────────────────────────────────────────
  async function saveNotifications() {
    setSavingNotifs(true)
    const supabase = createClient()
    const { error } = await supabase.from('user_settings').update({
      email_alerts_enabled: emailAlertsEnabled,
      alert_days_before: [...alertDays].sort((a, b) => b - a),
      extra_recipients: extraRecipients,
      notification_preference: notifPref,
      phone_number: phoneNumber.trim() || null,
    }).eq('user_id', userId)
    setSavingNotifs(false)
    if (error) flashError('Could not save your notification settings — please try again.')
    else flashSaved()
  }

  function toggleAlertDay(day: number) {
    setAlertDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function addRecipient() {
    const email = newRecipient.trim().toLowerCase()
    if (!email || !email.includes('@') || extraRecipients.includes(email)) return
    setExtraRecipients(prev => [...prev, email])
    setNewRecipient('')
  }

  // ── change password ─────────────────────────────────────────────────────────
  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) {
      setPasswordError(error.message)
    } else {
      setNewPassword('')
      setConfirmPassword('')
      flashSaved()
    }
  }

  // ── delete account ──────────────────────────────────────────────────────────
  async function deleteAccount() {
    setDeletingAccount(true)
    try {
      // Deletion needs the service role (auth user + storage files), so it
      // runs through a server route — RLS blocks deleting the users row here.
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        flashError((body as { error?: string }).error ?? 'Failed to delete account — please try again.')
        setDeletingAccount(false)
        setShowDeleteModal(false)
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      flashError('Network error — please try again.')
      setDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="max-w-4xl">
      {showDeleteModal && (
        <DeleteModal
          onConfirm={deleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deletingAccount}
        />
      )}
      <SaveBanner saved={saved} error={saveError} />

      {/* mobile nav strip */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-3 mb-6 border-b border-border/60">
        {NAV_SECTIONS.map(nav => (
          <button
            key={nav.id}
            onClick={() => scrollToSection(nav.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap border transition-all ${
              activeSection === nav.id ? 'bg-primary/15 text-primary border-primary/30' : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <nav.icon className={`w-3.5 h-3.5 shrink-0 ${activeSection === nav.id ? 'text-primary' : ''}`} />
            {nav.label}
          </button>
        ))}
      </div>

      <div className="flex gap-8 items-start">
        {/* sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-44 sticky top-20 shrink-0">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2 text-sm">Manage your account and preferences</p>
          </div>
          <nav className="space-y-0.5">
            {NAV_SECTIONS.map(nav => (
              <button
                key={nav.id}
                onClick={() => scrollToSection(nav.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border transition-all ${
                  activeSection === nav.id
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-glow-soft'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-white/[0.03]'
                }`}
              >
                <nav.icon className={`w-4 h-4 shrink-0 ${activeSection === nav.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                {nav.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* mobile header */}
          <div className="md:hidden mb-2">
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your account and preferences</p>
          </div>

          {/* ── Profile ── */}
          <Section id="profile" title="Profile" icon={User}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Email</label>
            <input
              disabled
              value={authEmail}
              className="w-full bg-surface-2/30 border border-border rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground/60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground/60 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Full name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Company</label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Ltd"
              className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Industry</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 shadow-glow-soft text-foreground text-sm font-medium transition-colors disabled:opacity-50"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </Section>

          {/* ── Business Profile ── */}
          <Section id="business" title="Business Profile" icon={Briefcase}>
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground/60 -mt-2">
            These answers personalise Claude&apos;s contract analysis to your industry and situation.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Business type</label>
              <select
                value={bizType}
                onChange={e => setBizType(e.target.value)}
                className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
              >
                <option value="">Select...</option>
                <option value="sole_trader">Sole Trader</option>
                <option value="partnership">Partnership</option>
                <option value="company">Company</option>
                <option value="trust">Trust</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Contract volume</label>
              <select
                value={contractVol}
                onChange={e => setContractVol(e.target.value)}
                className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
              >
                <option value="">Select...</option>
                <option value="1-5">1–5 contracts</option>
                <option value="5-20">5–20 contracts</option>
                <option value="20-50">20–50 contracts</option>
                <option value="50+">50+ contracts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Contract types you deal with</label>
            <div className="flex flex-wrap gap-2">
              {CONTRACT_TYPE_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBizContractTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    bizContractTypes.includes(t)
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-surface-2/60 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Biggest contract headache</label>
            <select
              value={bizHeadache}
              onChange={e => setBizHeadache(e.target.value)}
              className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
            >
              <option value="">Select...</option>
              {HEADACHE_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Have you been caught out by a clause?</label>
            <select
              value={bizCaughtOut}
              onChange={e => setBizCaughtOut(e.target.value)}
              className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
            >
              <option value="">Select...</option>
              <option value="yes_costly">Yes, it cost me money</option>
              <option value="yes_caught">Yes, but caught it in time</option>
              <option value="not_yet">Not yet, but worried</option>
              <option value="no_never">No, never</option>
            </select>
          </div>

          <button
            onClick={saveBusinessProfile}
            disabled={savingBusiness}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 shadow-glow-soft text-foreground text-sm font-medium transition-colors disabled:opacity-50"
          >
            {savingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingBusiness ? 'Saving…' : 'Save business profile'}
          </button>
        </div>
      </Section>

          {/* ── Notifications ── */}
          <Section id="notifications" title="Notifications" icon={Bell}>
        <div className="space-y-6">
          {/* Notification preference */}
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Alert method</p>
            <p className="text-xs text-muted-foreground mb-3">How you want to receive deadline notifications</p>
            <div className="space-y-2">
              {([
                { value: 'email_only', label: 'Email only', desc: 'Alerts sent to your inbox' },
                { value: 'email_sms', label: 'Email + SMS', desc: 'Email and text message alerts' },
                { value: 'in_app_only', label: 'In-app only', desc: 'Dashboard notifications only' },
              ] as const).map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setNotifPref(p.value)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm border transition-colors ${
                    notifPref === p.value
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-surface-2/60 border-border hover:border-primary/30'
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-medium text-sm ${notifPref === p.value ? 'text-foreground' : 'text-muted-foreground'}`}>{p.label}</p>
                    <p className="text-xs text-muted-foreground/60">{p.desc}</p>
                  </div>
                  {notifPref === p.value && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {notifPref === 'email_sms' && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Phone number <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            )}
          </div>

          {/* Email alerts toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground font-medium">Email alerts</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receive deadline reminders by email</p>
            </div>
            <button
              onClick={() => setEmailAlertsEnabled(e => !e)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlertsEnabled ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailAlertsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Alert days */}
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Alert me before deadlines</p>
            <p className="text-xs text-muted-foreground mb-3">Select how many days in advance you want reminders</p>
            <div className="flex flex-wrap gap-2">
              {ALERT_DAY_OPTIONS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleAlertDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    alertDays.includes(day)
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {day} days
                </button>
              ))}
            </div>
          </div>

          {/* Extra recipients */}
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Extra recipients</p>
            <p className="text-xs text-muted-foreground mb-3">Send alerts to additional email addresses</p>
            <div className="space-y-2 mb-3">
              {extraRecipients.map(email => (
                <div key={email} className="flex items-center justify-between py-2 px-3 bg-surface-2/60 border border-border rounded-lg">
                  <span className="text-sm text-muted-foreground">{email}</span>
                  <button
                    onClick={() => setExtraRecipients(prev => prev.filter(e => e !== email))}
                    className="text-muted-foreground/60 hover:text-danger transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newRecipient}
                onChange={e => setNewRecipient(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRecipient()}
                placeholder="colleague@company.com"
                className="flex-1 bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              <button
                onClick={addRecipient}
                className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={saveNotifications}
            disabled={savingNotifs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 shadow-glow-soft text-foreground text-sm font-medium transition-colors disabled:opacity-50"
          >
            {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingNotifs ? 'Saving…' : 'Save notifications'}
          </button>
        </div>
      </Section>

          {/* ── Billing ── */}
          <BillingSection planTier={planTier} contractLimit={contractLimit} hasStripeCustomer={!!profile?.stripe_customer_id} />

          {/* ── Account ── */}
          <Section id="account" title="Account" icon={Shield}>
        <div className="space-y-8">
          {/* Change password */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Change password</h3>
            <form onSubmit={changePassword} className="space-y-3">
              {passwordError && (
                <div className="px-3.5 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {passwordError}
                </div>
              )}
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                minLength={8}
                required
                className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full bg-surface-2/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 shadow-glow-soft text-foreground text-sm font-medium transition-colors disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          {/* Sign out */}
          <div className="border-t border-border/60 pt-6">
            <h3 className="text-sm font-medium text-foreground mb-1">Sign out</h3>
            <p className="text-xs text-muted-foreground mb-3">Sign out of your account on this device</p>
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {/* Danger zone */}
          <div className="border-t border-danger/10 pt-6">
            <h3 className="text-sm font-medium text-danger mb-1">Danger zone</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Permanently delete your account and all contract data. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger/20 text-danger hover:bg-danger/10 text-sm transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Delete account
            </button>
          </div>
        </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
