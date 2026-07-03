'use client'

import { Upload, Sparkles, BellRing, FileText, ShieldAlert, Calendar } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Interactive workflow visualization — three "nodes" (Upload → Analyze → Alert)
 * connected by animated SVG paths with flowing particles.
 * Feels like a real pipeline processing data live.
 */
export function WorkflowVisualization() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  // Cycle the "active" step for the live pipeline feel.
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % 3)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Desktop workflow */}
      <div className="hidden md:block relative">
        {/* SVG connecting lines with animated particles */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 260"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="20%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="flowGradBright" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0" />
              <stop offset="50%" stopColor="#c4b5fd" stopOpacity="1" />
              <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background line — the "rail" */}
          <path
            d="M 170 130 Q 340 60, 500 130 T 830 130"
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeWidth="1.5"
          />
          {/* Animated dashed flow */}
          <path
            d="M 170 130 Q 340 60, 500 130 T 830 130"
            fill="none"
            stroke="url(#flowGrad)"
            strokeWidth="2"
            className="flow-line"
            filter="url(#glow)"
          />

          {/* Traveling particles along the path */}
          <FlowParticle path="M 170 130 Q 340 60, 500 130 T 830 130" delay={0} />
          <FlowParticle path="M 170 130 Q 340 60, 500 130 T 830 130" delay={1.3} />
          <FlowParticle path="M 170 130 Q 340 60, 500 130 T 830 130" delay={2.6} />
        </svg>

        {/* Nodes */}
        <div className="relative grid grid-cols-3 gap-8 pt-4">
          <WorkflowNode
            n="01"
            icon={<Upload size={20} />}
            title="Upload"
            body="Drag and drop your PDFs or Word contracts. Any format. Any length."
            detail={<UploadDetail />}
            active={activeStep === 0}
          />
          <WorkflowNode
            n="02"
            icon={<Sparkles size={20} />}
            title="Analyze"
            body="AI reads every clause, extracts every date, flags every risk in under 60 seconds."
            detail={<AnalyzeDetail active={activeStep === 1} />}
            active={activeStep === 1}
            highlight
          />
          <WorkflowNode
            n="03"
            icon={<BellRing size={20} />}
            title="Alert"
            body="Get notified at 90, 60, 30, 14, and 7 days before every critical deadline."
            detail={<AlertDetail />}
            active={activeStep === 2}
          />
        </div>
      </div>

      {/* Mobile stacked workflow */}
      <div className="md:hidden space-y-3">
        <WorkflowNode
          n="01"
          icon={<Upload size={20} />}
          title="Upload"
          body="Drag and drop your PDFs or Word contracts."
          active={activeStep === 0}
          compact
        />
        <MobileConnector />
        <WorkflowNode
          n="02"
          icon={<Sparkles size={20} />}
          title="Analyze"
          body="AI reads every clause and flags every risk in under 60 seconds."
          active={activeStep === 1}
          highlight
          compact
        />
        <MobileConnector />
        <WorkflowNode
          n="03"
          icon={<BellRing size={20} />}
          title="Alert"
          body="Get notified before every critical deadline."
          active={activeStep === 2}
          compact
        />
      </div>
    </div>
  )
}

function FlowParticle({ path, delay }: { path: string; delay: number }) {
  return (
    <circle r="4" fill="url(#flowGradBright)" filter="url(#glow)">
      <animateMotion
        dur="4s"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
        rotate="auto"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.1;0.9;1"
        dur="4s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  )
}

function WorkflowNode({
  n, icon, title, body, detail, active, highlight, compact,
}: {
  n: string
  icon: React.ReactNode
  title: string
  body: string
  detail?: React.ReactNode
  active?: boolean
  highlight?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 transition-all duration-500 ${
        active
          ? 'border-primary/50 bg-gradient-to-b from-primary/[0.10] to-card shadow-glow'
          : highlight
          ? 'border-border bg-card'
          : 'border-border bg-card'
      }`}
    >
      {/* number */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <div
            className={`size-12 rounded-xl grid place-items-center transition-all duration-500 ${
              active
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'bg-primary/10 border border-primary/20 text-primary'
            }`}
          >
            {icon}
          </div>
          {active && (
            <span className="absolute inset-0 rounded-xl border-2 border-primary/60 pulse-ring text-primary" />
          )}
        </div>
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-colors ${
          active ? 'border-primary/40 text-primary bg-primary/10' : 'border-border text-muted-foreground'
        }`}>
          STEP {n}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{body}</p>

      {!compact && detail}

      {/* processing indicator when active */}
      {active && !compact && (
        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-breathe" />
          Processing
        </div>
      )}
    </div>
  )
}

function UploadDetail() {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-border bg-surface-2/40 p-3">
      <div className="flex items-center gap-2 text-xs">
        <FileText size={12} className="text-primary" />
        <span className="truncate">brisbane-lease-2026.pdf</span>
        <span className="ml-auto text-[10px] text-muted-foreground">2.3 MB</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          style={{ width: '100%', animation: 'gradient-shift 3s ease-in-out infinite' }}
        />
      </div>
    </div>
  )
}

function AnalyzeDetail({ active }: { active: boolean }) {
  const rows = [
    { label: 'Extracting dates', done: true },
    { label: 'Parsing clauses', done: true },
    { label: 'Scoring risk', done: active },
  ]
  return (
    <div className="mt-2 space-y-1.5">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-2 text-[11px]">
          <span
            className={`size-1.5 rounded-full transition-colors ${
              r.done ? 'bg-success' : 'bg-primary animate-breathe'
            }`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
          <span className={r.done ? 'text-foreground/90' : 'text-muted-foreground'}>{r.label}</span>
          {r.done && <span className="ml-auto text-[10px] text-success">✓</span>}
        </div>
      ))}
    </div>
  )
}

function AlertDetail() {
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-2.5 py-1.5">
        <ShieldAlert size={11} className="text-danger" />
        <span className="text-[11px] font-medium">Auto-renewal in 14 days</span>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/5 px-2.5 py-1.5">
        <Calendar size={11} className="text-warning" />
        <span className="text-[11px] font-medium">Notice period ends 5 Aug</span>
      </div>
    </div>
  )
}

function MobileConnector() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <div className="h-8 w-px bg-gradient-to-b from-primary/40 to-transparent relative">
        <span className="absolute -left-1 top-2 size-2 rounded-full bg-primary animate-breathe" />
      </div>
    </div>
  )
}
