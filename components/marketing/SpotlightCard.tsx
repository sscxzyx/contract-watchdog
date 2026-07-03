'use client'

import { useRef, type ReactNode } from 'react'

/**
 * Wrap children in a card that projects a cursor-following radial spotlight.
 * Inspired by Apple product pages / Vercel dashboard cards.
 */
export function SpotlightCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`card-spotlight ${className}`}
    >
      {children}
    </div>
  )
}
