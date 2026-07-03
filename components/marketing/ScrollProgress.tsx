'use client'

import { useEffect, useState } from 'react'

/**
 * Thin progress bar pinned to the top of the viewport that fills as the user
 * scrolls the page. Gives immediate feedback that the page is "responsive".
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? (scrolled / height) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-secondary to-primary shadow-glow-soft transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
