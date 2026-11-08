'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/controva-logo.png"
            alt="Controva"
            width={226}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>

        <div className="bg-surface border border-[#262A33] rounded-xl p-6">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 border border-accent/20 mb-4">
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-lg font-semibold text-[#F2F0EB] mb-1.5">Check your email</h1>
              <p className="text-sm text-[#9BA1AC]">
                We&apos;ve sent a password reset link to <span className="text-[#F2F0EB]">{email}</span>.
                It may take a minute to arrive.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-[#F2F0EB] mb-1">Reset your password</h1>
              <p className="text-sm text-[#9BA1AC] mb-5">
                Enter the email you signed up with. We&apos;ll send you a link to set a new password.
              </p>

              {error && (
                <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-[#E5484D]/10 border border-[#E5484D]/20 text-[#E5484D] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9BA1AC] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full bg-[#1E222B] border border-[#262A33] rounded-lg px-3.5 py-2.5 text-sm text-[#F2F0EB] placeholder:text-[#9BA1AC] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-[#0F1115] font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[#9BA1AC] mt-4">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
