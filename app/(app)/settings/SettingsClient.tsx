'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Bell, CreditCard, Shield, Check,
  Loader2, Plus, X, AlertTriangle, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as UserType, UserSettings, PlanTier } from '@/types/database'

// ─── constants ────────────────────────────────────────────────────────────────

const ALERT_DAY_OPTIONS = [7, 14, 30, 60, 90]

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

const PLAN_COLOUR: Record<PlanTier, string> = {
  starter: 'text-accent bg-accent/10 border-accent/20',
  business: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  agency: 'text-green-400 bg-green-400/10 border-green-400/20',
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-[#27272a] rounded-xl p-6">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#1a1a1a]">
        <Icon className="w-4 h-4 text-[#a1a1aa]" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── save banner ──────────────────────────────────────────────────────────────

function SaveBanner({ saved }: { saved: boolean }) {
  if (!saved) return null
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
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
      <div className="bg-surface border border-[#27272a] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-400/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg">Delete account</h2>
        </div>
        <p className="text-[#a1a1aa] text-sm mb-4 leading-relaxed">
          This will permanently delete your account and all contracts. This cannot be undone.
        </p>
        <p className="text-[#a1a1aa] text-sm mb-2">Type <span className="text-white font-mono">delete</span> to confirm:</p>
        <input
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-red-400/50 mb-4 transition-colors"
          placeholder="delete"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || confirm !== 'delete'}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</> : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
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
  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const planTier = (profile?.plan_tier ?? 'starter') as PlanTier
  const contractLimit = PLAN_LIMITS[planTier]

  // ── save profile ────────────────────────────────────────────────────────────
  async function saveProfile() {
    setSavingProfile(true)
    const supabase = createClient()
    await supabase.from('users').update({
      full_name: fullName.trim() || null,
      company_name: company.trim() || null,
      industry: industry.trim() || null,
    }).eq('id', userId)
    setSavingProfile(false)
    flashSaved()
  }

  // ── save notifications ──────────────────────────────────────────────────────
  async function saveNotifications() {
    setSavingNotifs(true)
    const supabase = createClient()
    await supabase.from('user_settings').update({
      email_alerts_enabled: emailAlertsEnabled,
      alert_days_before: alertDays.sort((a, b) => b - a),
      extra_recipients: extraRecipients,
    }).eq('user_id', userId)
    setSavingNotifs(false)
    flashSaved()
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
    const supabase = createClient()
    // Deleting the user row cascades to contracts, events, alerts, settings
    await supabase.from('users').delete().eq('id', userId)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-2xl space-y-6">
      {showDeleteModal && (
        <DeleteModal
          onConfirm={deleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deletingAccount}
        />
      )}
      <SaveBanner saved={saved} />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-[#a1a1aa] mt-1 text-sm">Manage your account and preferences</p>
      </div>

      {/* ── Profile ── */}
      <Section title="Profile" icon={User}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5 uppercase tracking-wide">Email</label>
            <input
              disabled
              value={authEmail}
              className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-[#52525b] cursor-not-allowed"
            />
            <p className="text-xs text-[#52525b] mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5 uppercase tracking-wide">Full name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5 uppercase tracking-wide">Company</label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Ltd"
              className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5 uppercase tracking-wide">Industry</label>
            <input
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. Technology, Retail, Healthcare"
              className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications" icon={Bell}>
        <div className="space-y-6">
          {/* Email alerts toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Email alerts</p>
              <p className="text-xs text-[#a1a1aa] mt-0.5">Receive deadline reminders by email</p>
            </div>
            <button
              onClick={() => setEmailAlertsEnabled(e => !e)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlertsEnabled ? 'bg-accent' : 'bg-[#27272a]'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailAlertsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Alert days */}
          <div>
            <p className="text-sm text-white font-medium mb-1">Alert me before deadlines</p>
            <p className="text-xs text-[#a1a1aa] mb-3">Select how many days in advance you want reminders</p>
            <div className="flex flex-wrap gap-2">
              {ALERT_DAY_OPTIONS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleAlertDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    alertDays.includes(day)
                      ? 'bg-accent/10 text-accent border-accent/20'
                      : 'bg-transparent text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                  }`}
                >
                  {day} days
                </button>
              ))}
            </div>
          </div>

          {/* Extra recipients */}
          <div>
            <p className="text-sm text-white font-medium mb-1">Extra recipients</p>
            <p className="text-xs text-[#a1a1aa] mb-3">Send alerts to additional email addresses</p>
            <div className="space-y-2 mb-3">
              {extraRecipients.map(email => (
                <div key={email} className="flex items-center justify-between py-2 px-3 bg-[#1a1a1a] border border-[#27272a] rounded-lg">
                  <span className="text-sm text-[#a1a1aa]">{email}</span>
                  <button
                    onClick={() => setExtraRecipients(prev => prev.filter(e => e !== email))}
                    className="text-[#52525b] hover:text-red-400 transition-colors"
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
                className="flex-1 bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
              <button
                onClick={addRecipient}
                className="px-3 py-2.5 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={saveNotifications}
            disabled={savingNotifs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingNotifs ? 'Saving…' : 'Save notifications'}
          </button>
        </div>
      </Section>

      {/* ── Billing ── */}
      <Section title="Billing" icon={CreditCard}>
        <div className="space-y-6">
          {/* Current plan */}
          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#27272a]">
            <div>
              <p className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium mb-1">Current plan</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${PLAN_COLOUR[planTier]}`}>
                  {PLAN_LABEL[planTier]}
                </span>
                <span className="text-sm text-[#a1a1aa]">
                  {contractLimit !== null ? `${contractLimit} contracts` : 'Unlimited contracts'}
                </span>
              </div>
            </div>
          </div>

          {/* Plan comparison */}
          <div className="space-y-2">
            {([
              { tier: 'starter', label: 'Starter', price: 'Free', limit: '5 contracts', features: ['AI analysis', 'Email alerts', 'Contract vault'] },
              { tier: 'business', label: 'Business', price: '£19/mo', limit: '25 contracts', features: ['Everything in Starter', 'Priority support', 'Custom alert days'] },
              { tier: 'agency', label: 'Agency', price: '£49/mo', limit: 'Unlimited contracts', features: ['Everything in Business', 'Multiple team members', 'API access'] },
            ] as const).map(plan => (
              <div
                key={plan.tier}
                className={`p-4 rounded-xl border ${plan.tier === planTier ? 'border-accent/30 bg-accent/5' : 'border-[#27272a] bg-[#0a0a0a]'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{plan.label}</span>
                    {plan.tier === planTier && (
                      <span className="text-xs text-accent font-medium">Current</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white">{plan.price}</span>
                </div>
                <p className="text-xs text-[#a1a1aa] mb-2">{plan.limit}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {plan.features.map(f => (
                    <span key={f} className="text-xs text-[#a1a1aa] flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-400 shrink-0" />{f}
                    </span>
                  ))}
                </div>
                {plan.tier !== planTier && plan.tier !== 'starter' && (
                  <button className="mt-3 text-xs text-accent font-medium hover:underline">
                    Upgrade to {plan.label} — coming soon
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Account ── */}
      <Section title="Account" icon={Shield}>
        <div className="space-y-8">
          {/* Change password */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">Change password</h3>
            <form onSubmit={changePassword} className="space-y-3">
              {passwordError && (
                <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
                className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          {/* Sign out */}
          <div className="border-t border-[#1a1a1a] pt-6">
            <h3 className="text-sm font-medium text-white mb-1">Sign out</h3>
            <p className="text-xs text-[#a1a1aa] mb-3">Sign out of your account on this device</p>
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {/* Danger zone */}
          <div className="border-t border-red-500/10 pt-6">
            <h3 className="text-sm font-medium text-red-400 mb-1">Danger zone</h3>
            <p className="text-xs text-[#a1a1aa] mb-3">
              Permanently delete your account and all contract data. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Delete account
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}
