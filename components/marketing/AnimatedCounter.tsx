'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Number that counts up from 0 to `to` once it enters the viewport.
 * Uses `requestAnimationFrame` with an ease-out curve for a polished tick.
 */
export function AnimatedCounter({
  to,
  duration = 1600,
  prefix = '',
  suffix = '',
  className = '',
}: {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3)
            setValue(Math.round(to * eased))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  )
}
