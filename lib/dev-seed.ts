import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanTier } from '@/types/database'

// Sample portfolio for the dev preview account. On tier switch the account's
// contracts are wiped and re-seeded with a portfolio sized to feel realistic
// for that tier (free's 1-contract limit up to a busy agency book).
const TIER_PORTFOLIO_SIZE: Record<PlanTier, number> = {
  free: 1,
  starter: 5,
  business: 10,
  agency: 16,
}

interface SeedEvent {
  type: string
  label: string
  inDays: number
}

interface SeedContract {
  slug: string
  name: string
  counterparty: string
  type: string
  status: 'active' | 'expiring_soon' | 'expired' | 'needs_review'
  risk: 'low' | 'medium' | 'high'
  health: number
  importance: number
  value: number
  startDaysAgo: number
  endInDays: number
  noticeInDays: number | null
  summary: string
  analysis: object
  events: SeedEvent[]
}

function analysis(
  flags: { severity: 'low' | 'medium' | 'high'; description: string }[],
  ours: string[],
  theirs: string[],
  cancellation: string,
  renewal: string,
) {
  return {
    risk_flags: flags,
    obligations_ours: ours,
    obligations_theirs: theirs,
    cancellation_terms: cancellation,
    renewal_terms: renewal,
    key_dates: [],
  }
}

// Ordered so each tier's slice stays interesting: the first entry is the
// high-risk lease (free tier's single contract), the first five mirror the
// marketing site's mockup portfolio.
const SEED_CONTRACTS: SeedContract[] = [
  {
    slug: 'brisbane-cbd-lease', name: 'Commercial Lease — Brisbane CBD', counterparty: 'Riverfront Property Group',
    type: 'Commercial Lease', status: 'expiring_soon', risk: 'high', health: 48, importance: 9, value: 100800,
    startDaysAgo: 660, endInDays: 60, noticeInDays: 14,
    summary: 'Two-year commercial lease for the Brisbane CBD premises at $8,400/month. The lease auto-renews for a further two-year term unless written notice is served at least 60 days before expiry — that notice window closes in 14 days. Contains a personal guarantee clause and annual CPI + 2% rent escalation.',
    analysis: analysis(
      [
        { severity: 'high', description: 'Auto-renewal clause: the lease renews for a further 2-year term unless notice is served 60 days before expiry.' },
        { severity: 'high', description: 'Personal guarantee: the director is personally liable for rent and make-good obligations.' },
        { severity: 'medium', description: 'Rent escalation of CPI + 2% compounds annually with no cap.' },
      ],
      ['Pay rent of $8,400/month by the 1st', 'Maintain public liability insurance of $20M', 'Make-good obligations on exit'],
      ['Structural repairs and building insurance', 'Provide 24/7 access to premises'],
      'Written notice at least 60 days before the end of the current term; early exit requires landlord consent and a break fee of 3 months rent.',
      'Automatically renews for a further 2-year term at market rent + CPI adjustment unless notice is served.',
    ),
    events: [
      { type: 'notice_deadline', label: 'Auto-renewal notice deadline', inDays: 14 },
      { type: 'expiry', label: 'Lease term ends', inDays: 60 },
    ],
  },
  {
    slug: 'toyota-equipment-finance', name: 'Equipment Finance — Toyota Hilux', counterparty: 'Toyota Financial Services',
    type: 'Equipment Finance', status: 'active', risk: 'medium', health: 71, importance: 6, value: 14400,
    startDaysAgo: 730, endInDays: 395, noticeInDays: 32,
    summary: 'Chattel mortgage over a Toyota Hilux at $1,200/month with a balloon payment due at term end. A balloon review window opens in 32 days where refinancing options can be locked in at better rates.',
    analysis: analysis(
      [
        { severity: 'medium', description: 'Balloon payment of $18,500 due at end of term — refinance window opens in 32 days.' },
        { severity: 'low', description: 'Early payout attracts a break cost calculated on remaining interest.' },
      ],
      ['Monthly repayment of $1,200', 'Comprehensive vehicle insurance', 'Maintain vehicle per manufacturer schedule'],
      ['Release encumbrance on final payment', 'Provide payout figures within 5 business days on request'],
      'Early payout permitted at any time; break costs apply based on remaining term.',
      'No auto-renewal; balloon may be refinanced, paid out, or the vehicle traded in.',
    ),
    events: [{ type: 'renewal', label: 'Balloon refinance window opens', inDays: 32 }],
  },
  {
    slug: 'coffee-co-supplier', name: 'Supplier Agreement — Coffee Co.', counterparty: 'Coffee Co. Australia',
    type: 'Supplier Agreement', status: 'needs_review', risk: 'medium', health: 63, importance: 4, value: 4080,
    startDaysAgo: 270, endInDays: 90, noticeInDays: 60,
    summary: 'Supply agreement for beans and consumables at ~$340/month. A CPI + 2% price escalation trigger activates next quarter, and minimum order volumes apply. Worth re-quoting before the escalation lands.',
    analysis: analysis(
      [
        { severity: 'medium', description: 'Price escalation trigger: CPI + 2% applies from next quarter automatically.' },
        { severity: 'low', description: 'Minimum monthly order volume of $250 or a shortfall fee applies.' },
      ],
      ['Minimum order of $250/month', 'Payment on 14-day terms'],
      ['Delivery within 3 business days', 'Replace defective stock at no cost'],
      'Either party may terminate with 30 days written notice after the initial 6-month term.',
      'Rolls monthly after the initial term with pricing reviewed quarterly.',
    ),
    events: [
      { type: 'price_change', label: 'CPI + 2% price escalation activates', inDays: 60 },
      { type: 'expiry', label: 'Initial supply term ends', inDays: 90 },
    ],
  },
  {
    slug: 'apex-electrical-subcontract', name: 'Subcontractor — Apex Electrical', counterparty: 'Apex Electrical Pty Ltd',
    type: 'Subcontractor Agreement', status: 'active', risk: 'medium', health: 66, importance: 7, value: 12500,
    startDaysAgo: 180, endInDays: 180, noticeInDays: 80,
    summary: 'Fixed-price subcontract for electrical works valued at $12,500. Contains broad indemnity language and a 25km non-compete radius clause. Contract ends in 6 months — extend or re-quote around the 80-day mark.',
    analysis: analysis(
      [
        { severity: 'medium', description: 'Broad indemnity: you indemnify the contractor for claims arising from your works, including third-party negligence.' },
        { severity: 'low', description: 'Non-compete radius clause restricts direct engagement with the head client within 25km for 12 months.' },
      ],
      ['Complete works to AS/NZS 3000 standard', 'Provide compliance certificates on completion', 'Carry $10M public liability cover'],
      ['Progress payments within 14 days of claim', 'Site access and safety induction'],
      'Termination for convenience by the head contractor with 10 business days notice; payment for works completed to date.',
      'No automatic renewal — extension requires a signed variation before the end date.',
    ),
    events: [{ type: 'notice_deadline', label: 'Extend or re-quote decision due', inDays: 80 }],
  },
  {
    slug: 'optus-business-plan', name: 'Optus Business Plan', counterparty: 'Optus',
    type: 'Service Agreement', status: 'active', risk: 'low', health: 88, importance: 2, value: 2160,
    startDaysAgo: 120, endInDays: 240, noticeInDays: 210,
    summary: 'Standard 12-month business mobile and internet bundle at $180/month. No unusual clauses; early termination fees taper over the term. Low risk.',
    analysis: analysis(
      [{ severity: 'low', description: 'Early termination fee applies, tapering monthly over the remaining term.' }],
      ['Monthly payment of $180 by direct debit'],
      ['Service availability per SLA', '30 days notice of plan changes'],
      'Cancel anytime; early termination fee equals 50% of remaining monthly charges.',
      'Rolls month-to-month at the same rate after the initial 12-month term.',
    ),
    events: [{ type: 'expiry', label: 'Plan contract ends', inDays: 240 }],
  },
  // ── business tier extras (6–10) ──────────────────────────────────────────
  {
    slug: 'public-liability-policy', name: 'Public Liability Insurance', counterparty: 'QBE Insurance',
    type: 'Insurance Policy', status: 'active', risk: 'low', health: 84, importance: 8, value: 1968,
    startDaysAgo: 300, endInDays: 65, noticeInDays: 50,
    summary: 'Annual $20M public liability policy at $164/month, auto-debited. Renewal invitation lands ~6 weeks before expiry — compare quotes before the auto-debit locks in another year.',
    analysis: analysis(
      [{ severity: 'low', description: 'Auto-renews on the anniversary date unless cancelled before the renewal debit.' }],
      ['Disclose material changes to business activities', 'Pay premium by direct debit'],
      ['Cover claims up to $20M per occurrence', '30 days notice of premium changes'],
      'Cancel with written notice; pro-rata refund minus administration fee.',
      'Auto-renews annually at the insurer’s revised premium unless cancelled before renewal.',
    ),
    events: [{ type: 'renewal', label: 'Policy auto-renewal debit', inDays: 65 }],
  },
  {
    slug: 'bunnings-trade-account', name: 'Bunnings Trade Account', counterparty: 'Bunnings Group',
    type: 'Supplier Agreement', status: 'active', risk: 'low', health: 90, importance: 3, value: 21600,
    startDaysAgo: 400, endInDays: 500, noticeInDays: null,
    summary: 'Rolling 30-day trade credit account averaging ~$1,800/month in materials. Standard PowerPass terms; interest applies to overdue balances.',
    analysis: analysis(
      [{ severity: 'low', description: 'Overdue balances accrue interest at 12% p.a. and can suspend the account.' }],
      ['Settle statement balance within 30 days'],
      ['Trade pricing and itemised statements'],
      'Either party may close the account at any time; outstanding balance falls due immediately.',
      'Rolling account — no fixed term.',
    ),
    events: [],
  },
  {
    slug: 'commercial-cleaning', name: 'Cleaning Contract — Officepro', counterparty: 'Officepro Cleaning Services',
    type: 'Service Agreement', status: 'active', risk: 'medium', health: 69, importance: 3, value: 7800,
    startDaysAgo: 150, endInDays: 215, noticeInDays: 185,
    summary: 'Weekly office cleaning at $650/month on a 12-month term. 90-day notice required to exit or the contract rolls for another full year — a long tail for a service this replaceable.',
    analysis: analysis(
      [{ severity: 'medium', description: '90-day exit notice with automatic 12-month rollover — miss it and you’re locked in for another year.' }],
      ['Monthly payment of $650', 'Provide after-hours site access'],
      ['Weekly clean per agreed scope', 'Police-checked staff'],
      '90 days written notice before term end; early exit pays 50% of remaining term.',
      'Rolls automatically for a further 12 months unless notice is served.',
    ),
    events: [{ type: 'notice_deadline', label: '90-day exit notice window opens', inDays: 125 }],
  },
  {
    slug: 'xero-subscription', name: 'Xero Accounting Subscription', counterparty: 'Xero Australia',
    type: 'Software Subscription', status: 'active', risk: 'low', health: 92, importance: 4, value: 840,
    startDaysAgo: 500, endInDays: 999, noticeInDays: null,
    summary: 'Monthly Xero Established plan at $70/month. Month-to-month, cancel anytime; pricing reviewed annually with 30 days notice.',
    analysis: analysis(
      [{ severity: 'low', description: 'Subscription price can rise with 30 days notice — increases have landed annually.' }],
      ['Monthly subscription payment'],
      ['Service uptime per SLA', 'Data export available on cancellation'],
      'Cancel from the billing portal effective end of the current billing month.',
      'Month-to-month; no fixed term.',
    ),
    events: [],
  },
  {
    slug: 'ford-transit-lease', name: 'Vehicle Lease — Ford Transit', counterparty: 'Custom Fleet',
    type: 'Equipment Finance', status: 'needs_review', risk: 'medium', health: 61, importance: 6, value: 19200,
    startDaysAgo: 540, endInDays: 55, noticeInDays: 25,
    summary: 'Operating lease on the work van at $800/month, ending in under two months. Excess-kilometre charges apply at return and the odometer is trending ~15% over allowance — budget for the shortfall or negotiate the buyout.',
    analysis: analysis(
      [
        { severity: 'medium', description: 'Excess kilometre charge of $0.18/km at return; current usage trends ~15% over allowance.' },
        { severity: 'low', description: 'Fair wear and tear standard applies — damage beyond it is charged at return.' },
      ],
      ['Monthly lease payment of $800', 'Service per manufacturer schedule'],
      ['Registration, insurance and roadside included', 'End-of-lease inspection report'],
      'Early termination pays the present value of remaining rentals.',
      'Options at end of term: return, extend month-to-month, or purchase at residual.',
    ),
    events: [{ type: 'expiry', label: 'Van lease ends — return or buy out', inDays: 55 }],
  },
  // ── agency tier extras (11–16) ───────────────────────────────────────────
  {
    slug: 'retainer-hendricks', name: 'Client Retainer — Hendricks Group', counterparty: 'Hendricks Group Pty Ltd',
    type: 'Client Contract', status: 'active', risk: 'medium', health: 74, importance: 9, value: 96000,
    startDaysAgo: 210, endInDays: 155, noticeInDays: 95,
    summary: 'Monthly service retainer at $8,000/month — the largest client on the book. Contains a 60-day termination-for-convenience clause in the client’s favour and IP assignment on payment.',
    analysis: analysis(
      [
        { severity: 'medium', description: 'Client can terminate for convenience on 60 days notice; revenue concentration risk.' },
        { severity: 'low', description: 'All IP assigns to the client on payment of each invoice.' },
      ],
      ['Deliver monthly scope per SOW', 'Monthly reporting by the 5th'],
      ['Retainer payment within 14 days', 'Timely approvals and access'],
      'Either party on 60 days written notice; client pays for work in progress.',
      'Renews annually at CPI-adjusted rates unless renegotiated.',
    ),
    events: [{ type: 'renewal', label: 'Retainer renewal negotiation window', inDays: 95 }],
  },
  {
    slug: 'it-support-msa', name: 'IT Support MSA — Netwise', counterparty: 'Netwise Managed Services',
    type: 'Service Agreement', status: 'active', risk: 'low', health: 82, importance: 5, value: 5400,
    startDaysAgo: 330, endInDays: 35, noticeInDays: 20,
    summary: 'Managed IT support at $450/month, term ending in 35 days. Renewal quote received at +8% — benchmark before accepting.',
    analysis: analysis(
      [{ severity: 'low', description: 'Proposed renewal carries an 8% price increase over the current term.' }],
      ['Monthly payment of $450', 'Report incidents via service desk'],
      ['Response times per severity SLA', 'Quarterly security patching'],
      '30 days notice at term end; mid-term exit pays remaining months.',
      '12-month renewal at quoted rates unless renegotiated before expiry.',
    ),
    events: [{ type: 'expiry', label: 'MSA term ends — renewal decision', inDays: 35 }],
  },
  {
    slug: 'waste-management', name: 'Waste Services — Cleanaway', counterparty: 'Cleanaway',
    type: 'Service Agreement', status: 'active', risk: 'medium', health: 67, importance: 2, value: 3120,
    startDaysAgo: 600, endInDays: 130, noticeInDays: 40,
    summary: 'Commercial waste collection at $260/month. Contains an evergreen clause: rolls for 24 months unless cancelled in a narrow 30-day window that opens in about 6 weeks.',
    analysis: analysis(
      [{ severity: 'medium', description: 'Evergreen renewal: 24-month rollover unless cancelled within a 30-day window before term end.' }],
      ['Monthly service payment', 'Bins accessible on collection day'],
      ['Weekly collection', 'Bin replacement for fair wear'],
      'Cancellation only within the designated notice window; otherwise the term rolls 24 months.',
      'Automatic 24-month renewal at reviewed rates.',
    ),
    events: [{ type: 'notice_deadline', label: 'Cancellation window opens', inDays: 40 }],
  },
  {
    slug: 'marketing-retainer', name: 'Marketing Retainer — Bright & Co', counterparty: 'Bright & Co Creative',
    type: 'Client Contract', status: 'expired', risk: 'low', health: 78, importance: 4, value: 30000,
    startDaysAgo: 420, endInDays: -20, noticeInDays: null,
    summary: 'Six-month campaign retainer at $5,000/month that ended three weeks ago. Final invoice settled; archive or renew with a fresh SOW.',
    analysis: analysis(
      [{ severity: 'low', description: 'Contract has ended — any continuing work is uncontracted until a new SOW is signed.' }],
      ['Campaign deliverables per SOW'],
      ['Monthly retainer payments', 'Brand asset access'],
      'Term complete.',
      'No auto-renewal; new engagement requires a fresh SOW.',
    ),
    events: [],
  },
  {
    slug: 'eftpos-terminal', name: 'EFTPOS Terminal Agreement', counterparty: 'Tyro Payments',
    type: 'Service Agreement', status: 'active', risk: 'low', health: 86, importance: 3, value: 1428,
    startDaysAgo: 90, endInDays: 275, noticeInDays: 245,
    summary: 'Terminal rental and processing at $119/month plus transaction fees. Standard 12-month term, 30-day exit notice thereafter.',
    analysis: analysis(
      [{ severity: 'low', description: 'Terminal return required within 14 days of cancellation or a non-return fee applies.' }],
      ['Monthly terminal rental', 'PCI compliance obligations'],
      ['Settlement within 1 business day', 'Terminal replacement for faults'],
      '30 days notice after the initial 12-month term.',
      'Rolls month-to-month after the initial term.',
    ),
    events: [],
  },
  {
    slug: 'recruitment-terms', name: 'Recruitment Terms — TalentFirst', counterparty: 'TalentFirst Recruitment',
    type: 'Service Agreement', status: 'needs_review', risk: 'high', health: 52, importance: 5, value: 18000,
    startDaysAgo: 60, endInDays: 305, noticeInDays: null,
    summary: 'Placement terms with a 20% fee and a 12-month ownership clause over introduced candidates — including ones hired for different roles later. Replacement guarantee is only 8 weeks. Renegotiate before the next hire.',
    analysis: analysis(
      [
        { severity: 'high', description: 'Candidate ownership: a 20% fee applies to any introduced candidate hired within 12 months, even for a different role.' },
        { severity: 'medium', description: 'Replacement guarantee limited to 8 weeks and excludes redundancy.' },
      ],
      ['Pay placement fee within 14 days of start date', 'Notify agency of any hire of an introduced candidate'],
      ['Candidate sourcing and screening', 'One replacement within the guarantee period'],
      'Terminate the terms at any time; ownership clause survives for introduced candidates.',
      'Terms apply per placement; no fixed term.',
    ),
    events: [],
  },
]

function dateInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function seedDevPortfolio(
  admin: SupabaseClient,
  userId: string,
  tier: PlanTier,
): Promise<{ error: string | null }> {
  const size = TIER_PORTFOLIO_SIZE[tier]
  const picks = SEED_CONTRACTS.slice(0, size)

  // contract_events and alerts_log cascade on contract delete
  const { error: deleteError } = await admin.from('contracts').delete().eq('user_id', userId)
  if (deleteError) return { error: 'Failed to clear existing portfolio' }

  const now = Date.now()
  const contractRows = picks.map((c, i) => ({
    id: randomUUID(),
    user_id: userId,
    file_name: `${c.slug}.pdf`,
    file_url: `${userId}/dev-sample/${c.slug}.pdf`,
    contract_name: c.name,
    counterparty_name: c.counterparty,
    contract_type: c.type,
    status: c.status,
    start_date: dateInDays(-c.startDaysAgo),
    end_date: dateInDays(c.endInDays),
    renewal_date: c.noticeInDays !== null ? dateInDays(c.noticeInDays) : null,
    notice_deadline: c.noticeInDays !== null ? dateInDays(c.noticeInDays) : null,
    contract_value: c.value,
    value_currency: 'AUD',
    value_extracted: true,
    importance_score: c.importance,
    health_score: c.health,
    risk_level: c.risk,
    ai_summary: c.summary,
    ai_analysis_json: c.analysis,
    created_at: new Date(now - (i + 1) * 2 * 86400000).toISOString(),
  }))

  const { error: contractError } = await admin.from('contracts').insert(contractRows)
  if (contractError) return { error: 'Failed to seed contracts' }

  const eventRows = picks.flatMap((c, i) =>
    c.events.map(e => ({
      contract_id: contractRows[i].id,
      user_id: userId,
      event_type: e.type,
      event_date: dateInDays(e.inDays),
      event_label: e.label,
    }))
  )

  if (eventRows.length) {
    const { error: eventError } = await admin.from('contract_events').insert(eventRows)
    if (eventError) return { error: 'Failed to seed contract events' }
  }

  return { error: null }
}
