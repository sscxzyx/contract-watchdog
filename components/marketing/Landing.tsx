'use client'

import {
  ArrowRight, Shield, Zap, Check, FileWarning, Bell, ShieldAlert,
  FolderLock, Activity, MapPin, Hammer, Coffee, Home, Briefcase,
  Sparkles, BellRing, Plus, Minus, Lock,
  Twitter, Linkedin, Clock, Eye,
} from 'lucide-react'
import { useState } from 'react'
import { Navbar } from './Navbar'
import { DashboardMockup } from './DashboardMockup'
import { Reveal } from './Reveal'
import { WorkflowVisualization } from './WorkflowVisualization'
import { AnimatedCounter } from './AnimatedCounter'
import { SpotlightCard } from './SpotlightCard'
import { ScrollProgress } from './ScrollProgress'

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <MetricsBand />
        <Problem />
        <Features />
        <WhoItsFor />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

/* ─────────── HERO ─────────── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Layered atmospheric background — Apple / DJI style */}
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-70" />
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute inset-0 mask-radial">
        <div className="aurora" />
      </div>
      <div className="absolute inset-0 mask-radial opacity-40">
        <div className="conic-beam" />
      </div>

      {/* Floating chips — like DJI product page callouts */}
      <FloatingBadge
        className="hidden lg:flex left-[6%] top-[38%]"
        delay={800}
        icon={<Zap size={12} className="text-primary" />}
        label="60 second analysis"
      />
      <FloatingBadge
        className="hidden lg:flex right-[6%] top-[30%]"
        delay={1000}
        icon={<Shield size={12} className="text-primary" />}
        label="256-bit encryption"
      />
      <FloatingBadge
        className="hidden lg:flex left-[8%] bottom-[18%]"
        delay={1200}
        icon={<Eye size={12} className="text-primary" />}
        label="24/7 monitoring"
      />
      <FloatingBadge
        className="hidden lg:flex right-[8%] bottom-[22%]"
        delay={1400}
        icon={<Clock size={12} className="text-primary" />}
        label="Advance warnings"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground shine">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                <span className="relative rounded-full bg-primary size-1.5" />
              </span>
              Built for Australian small business
            </span>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
            <span className="text-gradient">Your contracts are full of traps.</span>
            <br />
            <span className="text-gradient-indigo">Controva finds them before they cost you.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 text-center text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered contract monitoring for Australian small businesses. Upload your
            contracts and Controva watches every deadline, flags every risk, and alerts
            you before it&apos;s too late.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:bg-primary/90 hover:shadow-glow hover:scale-[1.02] transition-all shine"
            >
              Start Free — No Card Required
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface-2/40 backdrop-blur px-6 py-3 text-sm font-medium hover:bg-surface-2 hover:border-primary/30 transition-all"
            >
              See How It Works
            </a>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Lock size={12} className="text-primary" /> 256-bit encryption</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> Built for Australian businesses</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={12} className="text-primary" /> Analysis in under 60 seconds</span>
            <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-primary" /> No lock-in contracts</span>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-16 relative animate-float-slow">
            <div className="absolute -inset-8 bg-primary/25 blur-3xl rounded-full opacity-60" />
            <div className="relative">
              <DashboardMockup />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FloatingBadge({
  className = '', icon, label, delay = 0,
}: { className?: string; icon: React.ReactNode; label: string; delay?: number }) {
  return (
    <div
      className={`absolute z-10 opacity-0 animate-float ${className}`}
      style={{
        animation: `float-y 6s ease-in-out infinite`,
        animationDelay: `${delay}ms, 0ms`,
      }}
    >
      <div
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/70 backdrop-blur-md px-3 py-1.5 text-xs shadow-glow-soft opacity-0"
        style={{
          animation: 'tick-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          animationDelay: `${delay}ms`,
        }}
      >
        {icon}
        {label}
      </div>
    </div>
  )
}

/* ─────────── SOCIAL PROOF ─────────── */
function SocialProof() {
  const items = [
    { icon: <Hammer size={14} />, label: 'Trades' },
    { icon: <Coffee size={14} />, label: 'Hospitality' },
    { icon: <Home size={14} />, label: 'Real Estate' },
    { icon: <Briefcase size={14} />, label: 'Professional Services' },
  ]
  // Duplicate for seamless marquee
  const marqueeItems = [...items, ...items, ...items, ...items]
  return (
    <section className="py-14 border-y border-border bg-surface overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Built for tradies, cafés, real estate agents and small businesses across Australia
        </p>
      </div>
      <div className="mt-6 relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />
        <div className="flex w-max animate-marquee gap-10">
          {marqueeItems.map((i, idx) => (
            <div key={`${i.label}-${idx}`} className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span className="text-primary">{i.icon}</span>
              {i.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── METRICS BAND ─────────── */
function MetricsBand() {
  const metrics = [
    { value: 60, suffix: 's', label: 'Average analysis time', gradient: 'from-primary to-secondary' },
    { value: 100, suffix: '%', label: 'Australian contract law focused', gradient: 'from-secondary to-primary' },
    { value: 90, suffix: ' days', label: 'Advance deadline warnings', gradient: 'from-primary to-secondary' },
    { value: 24, suffix: '/7', label: 'Continuous monitoring', gradient: 'from-secondary to-primary' },
  ]
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-dots opacity-40" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
          {metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 90}>
              <div className="text-center">
                <div className={`text-4xl md:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${m.gradient}`}>
                  <AnimatedCounter to={m.value} suffix={m.suffix} />
                </div>
                <p className="mt-2 text-xs md:text-sm text-muted-foreground">{m.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── PROBLEM ─────────── */
function Problem() {
  const problems = [
    {
      icon: <FileWarning />,
      title: 'Auto-renewals that lock you in',
      body: "You signed a 12 month deal. You forgot. Now you're stuck for another 12 months at a higher rate. It happens to thousands of businesses every year.",
    },
    {
      icon: <Bell />,
      title: 'Notice deadlines you missed by days',
      body: "Most contracts have a tiny clause requiring 30, 60 or 90 days notice. Miss it by a day and you've locked yourself in or lost your bond.",
    },
    {
      icon: <ShieldAlert />,
      title: 'Risky clauses buried in legal jargon',
      body: 'Personal guarantees, indemnity clauses, price escalation triggers — buried in pages of dense text most people never read until it\'s too late.',
    },
  ]
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionEyebrow>The problem</SectionEyebrow>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-tight">
            Small businesses lose thousands every year to{' '}
            <span className="text-gradient-indigo">contracts they forgot about</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <SpotlightCard className="group h-full rounded-xl border border-border bg-card p-6 hover:border-danger/40 hover:-translate-y-1 transition-all duration-300">
                <div className="size-10 rounded-lg bg-danger/10 border border-danger/20 text-danger grid place-items-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {p.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── FEATURES ─────────── */
function Features() {
  const features = [
    {
      icon: <Sparkles />, title: 'AI Contract Analysis',
      body: 'Upload any contract and our AI reads every clause, extracts every date, and gives you a plain-English summary in under 60 seconds. No legal jargon. Just clarity.',
    },
    {
      icon: <BellRing />, title: 'Deadline Alerts',
      body: 'Never miss a renewal window or notice deadline again. Controva alerts you at 90, 60, 30, 14 and 7 days before every critical date — by email or SMS.',
    },
    {
      icon: <ShieldAlert />, title: 'Risk Flagging',
      body: 'Controva automatically flags dangerous clauses — personal liability traps, auto-renewal gotchas, price escalation triggers — colour coded by severity.',
    },
    {
      icon: <FolderLock />, title: 'Contract Vault',
      body: 'All your contracts stored securely in one place. Search, sort and filter by risk level, value, expiry date or status. Your entire portfolio at a glance.',
    },
    {
      icon: <Activity />, title: 'Portfolio Health Score',
      body: 'Get an instant health score across your entire contract portfolio. See your overall risk at a glance and know exactly what needs attention.',
    },
    {
      icon: <MapPin />, title: 'Built for Australia',
      body: "Controva understands Australian contract law, QBCC licensing, retail leasing regulations and local business requirements. Not a generic overseas tool.",
    },
  ]
  return (
    <section id="features" className="py-24 md:py-32 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 mask-fade-b" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionEyebrow>What it does</SectionEyebrow>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-tight">
            Controva watches your contracts{' '}
            <span className="text-gradient-indigo">so you don&apos;t have to</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <SpotlightCard className="group h-full rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-glow-soft hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 size-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 text-primary grid place-items-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── WHO IT'S FOR ─────────── */
function WhoItsFor() {
  const audiences = [
    {
      icon: <Hammer />, title: "Tradies & Contractors",
      body: 'Subcontractor agreements, equipment leases, supplier contracts — Controva tracks every deadline and flags every liability clause so you can focus on the job.',
    },
    {
      icon: <Coffee />, title: "Cafés & Restaurants",
      body: 'Lease renewals, supplier agreements, equipment finance — one missed deadline can cost you your location. Controva makes sure that never happens.',
    },
    {
      icon: <Home />, title: 'Real Estate & Property',
      body: 'Managing multiple leases and vendor agreements is complex. Controva gives you a single view of every contract, every deadline, every risk.',
    },
    {
      icon: <Briefcase />, title: 'Professional Services',
      body: "Client contracts, software subscriptions, office leases — Controva monitors everything so nothing slips through the cracks.",
    },
  ]
  return (
    <section id="who" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-tight">
            Built for the way <span className="text-gradient-indigo">Australians actually do business</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-2 gap-5">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 70}>
              <SpotlightCard className="group h-full rounded-xl border border-border bg-card p-7 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="size-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── HOW IT WORKS ─────────── */
function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-32 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-fine opacity-40 mask-fade-b" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/[0.07] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-tight">
            Up and running in <span className="text-gradient-indigo">under 5 minutes</span>
          </h2>
          <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
            Watch your contracts move through the Controva pipeline — from raw PDF to instant, actionable alerts.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-16">
            <WorkflowVisualization />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────── PRICING ─────────── */
function Pricing() {
  const [annual, setAnnual] = useState(false)
  const factor = annual ? 0.8 : 1
  const fmt = (n: number) => Math.round(n * factor)

  const plans = [
    {
      name: 'Starter', price: 29,
      features: ['Up to 15 contracts', 'AI contract analysis', 'Email alerts', 'Plain English summaries', '1 user'],
      cta: 'Start Free Trial', popular: false,
    },
    {
      name: 'Business', price: 59,
      features: ['Up to 30 contracts', 'AI analysis + risk scoring', 'Email and SMS alerts', '90-day advance warnings', 'Team access (3 users)', 'Priority support'],
      cta: 'Start Free Trial', popular: true,
    },
    {
      name: 'Agency', price: 190,
      features: ['Unlimited contracts + 50GB storage', 'Everything in Business', 'White-label option', 'API access', 'Unlimited users'],
      cta: 'Start Free Trial', popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-tight">
            Simple pricing. No surprises. <span className="text-gradient-indigo">Cancel anytime.</span>
          </h2>
          <p className="mt-4 text-center text-muted-foreground">Start free — no credit card required</p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-1.5 text-xs rounded-full transition-all duration-300 ${!annual ? 'bg-primary text-primary-foreground shadow-glow-soft' : 'text-muted-foreground'}`}
              >Monthly</button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-1.5 text-xs rounded-full transition-all duration-300 inline-flex items-center gap-1.5 ${annual ? 'bg-primary text-primary-foreground shadow-glow-soft' : 'text-muted-foreground'}`}
              >
                Annual
                <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">Save 20%</span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <SpotlightCard
                className={`relative h-full rounded-2xl border p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  p.popular
                    ? 'border-gold/50 bg-gradient-to-b from-gold/[0.08] to-card shadow-glow glow-border'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-gold text-[#0F1115] px-3 py-1 rounded-full shadow-glow-soft z-10">
                    Most Popular
                  </span>
                )}
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{p.name}</h3>
                {annual ? (
                  <>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">${fmt(p.price) * 12}</span>
                      <span className="text-sm text-muted-foreground">AUD/year</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">${fmt(p.price)}/mo</p>
                  </>
                ) : (
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">${fmt(p.price)}</span>
                    <span className="text-sm text-muted-foreground">AUD/month</span>
                  </div>
                )}
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-all shine ${
                    p.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-soft'
                      : 'border border-border bg-surface-2 hover:bg-surface-2/60 hover:border-primary/30'
                  }`}
                >
                  {p.cta}
                </a>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── FAQ ─────────── */
function FAQ() {
  const faqs = [
    { q: 'Is my contract data secure?', a: 'Yes. All contracts are encrypted at rest (AES-256) and in transit (TLS), and your data is never sold, shared for marketing, or used to train AI models.' },
    { q: 'What types of contracts does Controva support?', a: 'Any contract in PDF or Word format — leases, supplier agreements, client contracts, employment agreements, subcontractor agreements and more.' },
    { q: 'Is Controva specific to Australia?', a: 'Yes. Controva is built specifically for Australian businesses and understands local contract law, regulations and requirements.' },
    { q: 'Can I cancel anytime?', a: 'Absolutely. No lock-in contracts. Cancel anytime from your account settings.' },
    { q: 'How accurate is the AI analysis?', a: "Controva's AI is highly accurate but we always recommend verifying critical dates independently. The platform is a monitoring aid, not a substitute for legal advice." },
    { q: 'What happens when I hit my contract limit?', a: "You'll be prompted to upgrade to the next plan. Your existing contracts and data are always safe." },
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center">
            Common <span className="text-gradient-indigo">questions</span>
          </h2>
        </Reveal>
        <div className="mt-12 space-y-2">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <Reveal key={f.q} delay={i * 40}>
                <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-primary/30 bg-card' : 'border-border bg-card hover:border-primary/20'
                }`}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-surface-2/40 transition-colors"
                  >
                    <span className="text-sm md:text-base font-medium">{f.q}</span>
                    <span className={`text-primary shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────── FINAL CTA ─────────── */
function FinalCTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-80" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full bg-primary/20 blur-[120px] animate-breathe" />
      <div className="absolute inset-0 mask-radial opacity-50">
        <div className="conic-beam" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            <span className="text-gradient">Stop letting contracts</span>
            <br />
            <span className="text-gradient-indigo">catch you off guard.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            Protect your business from costly contract surprises with Controva AI.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-9 flex flex-col items-center gap-3">
            <a
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground shadow-glow hover:bg-primary/90 hover:scale-[1.02] transition-all shine"
            >
              Start Free Today — No Card Required
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <p className="text-xs text-muted-foreground">
              First contract analysed free. Cancel anytime. Built in Australia.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────── FOOTER ─────────── */
function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-1 text-lg font-semibold tracking-tight">
              Controva<span className="text-primary">AI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Never miss a deadline. Never miss a clause.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="#" aria-label="LinkedIn" className="size-9 rounded-md border border-border bg-card hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 grid place-items-center transition-all">
                <Linkedin size={14} />
              </a>
              <a href="#" aria-label="Twitter" className="size-9 rounded-md border border-border bg-card hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 grid place-items-center transition-all">
                <Twitter size={14} />
              </a>
            </div>
          </div>
          <FooterCol title="Product" links={[['Features', '#features'], ['Pricing', '#pricing'], ['About', '#who']]} />
          <FooterCol title="Company" links={[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Contact', 'mailto:legal@controva.co']]} />
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 Controva AI. Built in Brisbane, Australia <span aria-hidden>🇦🇺</span>
          </p>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Shield size={11} className="text-primary" /> 256-bit encryption
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-sm text-foreground/80 hover:text-primary transition-colors">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─────────── shared ─────────── */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center mb-4">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="size-1 rounded-full bg-primary animate-breathe" />
        {children}
      </span>
    </div>
  )
}
