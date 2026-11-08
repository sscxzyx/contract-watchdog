'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Archive, Upload, Settings, Menu, X, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vault', label: 'Vault', icon: Archive },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const PLAN_LABEL: Record<string, string> = {
  free: 'Free Plan',
  starter: 'Starter Plan',
  business: 'Business Plan',
  agency: 'Agency Plan',
}

const PLAN_LIMIT: Record<string, string> = {
  free: '1 contract limit',
  starter: '15 contract limit',
  business: '30 contract limit',
  agency: 'Unlimited contracts',
}

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [planTier, setPlanTier] = useState<string>('free')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('users').select('plan_tier').single().then(({ data }) => {
      if (data?.plan_tier) setPlanTier(data.plan_tier)
    })
  }, [])

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const navLinks = navItems.map(({ href, label, icon: Icon }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        key={href}
        href={href}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
          isActive
            ? 'bg-primary/10 text-primary border-primary/20 shadow-glow-soft'
            : 'text-muted-foreground border-transparent hover:bg-white/[0.03] hover:text-foreground/90'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground/80'}`} />
        {label}
      </Link>
    )
  })

  const planCard = (
    <div className="relative overflow-hidden px-3 py-3 rounded-lg bg-primary/[0.06] border border-primary/20">
      <span className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/15 blur-2xl animate-breathe" />
      <p className="relative text-xs font-semibold text-primary">{PLAN_LABEL[planTier] ?? 'Free Plan'}</p>
      <p className="relative text-xs text-muted-foreground mt-0.5">{PLAN_LIMIT[planTier] ?? '1 contract limit'}</p>
      {planTier === 'free' && (
        <Link
          href="/settings#billing"
          className="relative mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-secondary transition-colors"
        >
          <Zap className="w-3 h-3" /> Upgrade
        </Link>
      )}
    </div>
  )

  const nav = (
    <>
      <div className="flex items-center px-5 py-4 border-b border-border">
        <Image
          src="/controva-logo.png"
          alt="Controva"
          width={158}
          height={28}
          className="h-7 w-auto"
          priority
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        {planCard}
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0F1115] border-r border-border flex-col z-50">
        {nav}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F1115]/90 backdrop-blur border-b border-border flex items-center justify-between px-4 z-50">
        <Image
          src="/controva-logo.png"
          alt="Controva"
          width={158}
          height={28}
          className="h-7 w-auto"
          priority
        />
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={`lg:hidden fixed left-0 top-14 bottom-0 w-64 bg-[#0F1115] border-r border-border flex flex-col z-50 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          {planCard}
        </div>
      </aside>
    </>
  )
}
