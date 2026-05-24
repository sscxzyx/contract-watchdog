'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Building2, Upload, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialName: string | null
}

const STEPS = [
  { id: 1, label: 'Your profile' },
  { id: 2, label: 'Upload a contract' },
  { id: 3, label: "You're all set" },
]

export default function OnboardingWizard({ userId, initialName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveProfile() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({
      company_name: company.trim() || null,
      industry: industry.trim() || null,
    }).eq('id', userId)
    setSaving(false)
    setStep(2)
  }

  async function finishOnboarding() {
    const supabase = createClient()
    await supabase.from('users').update({ onboarding_complete: true }).eq('id', userId)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Controva</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${step >= s.id ? 'text-white' : 'text-[#52525b]'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step > s.id ? 'bg-green-400 text-black' :
                  step === s.id ? 'bg-accent text-white' :
                  'bg-[#27272a] text-[#52525b]'
                }`}>
                  {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${step > s.id ? 'bg-green-400/50' : 'bg-[#27272a]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="bg-surface border border-[#27272a] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Welcome{initialName ? `, ${initialName.split(' ')[0]}` : ''}!</h2>
                <p className="text-xs text-[#a1a1aa]">Tell us a bit about your business</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5 uppercase tracking-wide">Company name</label>
                <input
                  autoFocus
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveProfile()}
                  placeholder="Acme Ltd"
                  className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5 uppercase tracking-wide">Industry</label>
                <input
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveProfile()}
                  placeholder="e.g. Technology, Retail, Healthcare"
                  className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Upload */}
        {step === 2 && (
          <div className="bg-surface border border-[#27272a] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Upload className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Upload your first contract</h2>
                <p className="text-xs text-[#a1a1aa]">AI will analyse it in under 30 seconds</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                We&apos;ll extract key dates, identify risk clauses, and give you a plain English summary of what you&apos;ve agreed to.
              </p>
              <div className="grid grid-cols-3 gap-3 py-2">
                {[
                  { label: 'Risk flags', desc: 'Colour-coded by severity' },
                  { label: 'Key dates', desc: 'Deadlines & renewals' },
                  { label: 'Health score', desc: '0–100 contract quality' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-[#1a1a1a] rounded-xl border border-[#27272a]">
                    <p className="text-white text-xs font-semibold mb-1">{item.label}</p>
                    <p className="text-[#52525b] text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.from('users').update({ onboarding_complete: true }).eq('id', userId)
                    router.push('/upload')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload contract
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="bg-surface border border-[#27272a] rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-400/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">You&apos;re all set!</h2>
            <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">
              Your account is ready. Head to your dashboard to upload contracts and start monitoring your portfolio.
            </p>
            <button
              onClick={finishOnboarding}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Go to dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
