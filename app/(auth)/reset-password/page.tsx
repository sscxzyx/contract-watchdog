'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase fires PASSWORD_RECOVERY when the user lands here from the email link.
  // If we don't see a session, the link is invalid/expired.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError('This reset link is invalid or has expired. Request a new one.')
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
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

        <div className="bg-surface border border-[#27272a] rounded-xl p-6">
          {done ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-1.5">Password updated</h1>
              <p className="text-sm text-[#a1a1aa]">Redirecting you to your dashboard…</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white mb-1">Set a new password</h1>
              <p className="text-sm text-[#a1a1aa] mb-5">Choose a strong password you haven&apos;t used before.</p>

              {error && (
                <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    disabled={!ready}
                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    disabled={!ready}
                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !ready}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[#a1a1aa] mt-4">
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
