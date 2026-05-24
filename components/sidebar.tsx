'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Archive, Upload, Settings, Shield, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vault', label: 'Vault', icon: Archive },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const nav = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#27272a]">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-semibold text-[15px] tracking-tight">Controva</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#27272a]">
        <div className="px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs font-medium text-accent">Starter Plan</p>
          <p className="text-xs text-[#a1a1aa] mt-0.5">5 contract limit</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-surface border-r border-[#27272a] flex-col z-50">
        {nav}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-[#27272a] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Controva</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={`lg:hidden fixed left-0 top-14 bottom-0 w-64 bg-surface border-r border-[#27272a] flex flex-col z-50 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
