import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import type { AiAnalysis, PlanTier } from '@/types/database'

export const runtime = 'nodejs'
export const maxDuration = 60

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[analyze] ANTHROPIC_API_KEY is not set')
}

// Cap the SDK timeout below Vercel's 60s function limit so a slow request
// returns a clean error instead of the whole function being killed mid-flight.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 50_000,
  maxRetries: 1,
})

// Contract limits per plan. null = unlimited. Mirrors the client UI in
// app/(app)/upload/page.tsx — but enforced here so the API can't be bypassed.
const PLAN_LIMITS: Record<PlanTier, number | null> = {
  free: 1,
  starter: 15,
  business: 30,
  agency: null,
}

const FREE_SCAN_INTERVAL_MS = 30 * 86400000

// Static analysis instructions — kept separate from the (variable) contract
// text and user context so the Anthropic prompt cache can reuse it across calls.
const SYSTEM_INSTRUCTIONS = `You are a contract analyst for Australian small businesses, with particular expertise in Queensland. You understand Australian contract law and the regulatory landscape small businesses operate in, including:
- The Australian Consumer Law (Competition and Consumer Act 2010 (Cth) Schedule 2), including the unfair contract terms regime that applies to standard form small business contracts.
- Queensland building and construction: QBCC licensing requirements under the Queensland Building and Construction Commission Act 1991, and security of payment rights under the Building Industry Fairness (Security of Payment) Act 2017 (Qld) — including progress payment rights, retention limits, and defects liability periods.
- Retail leasing: the Retail Shop Leases Act 1994 (Qld) — minimum 6-month notice for option exercise windows, disclosure statement requirements, prohibition on ratchet rent clauses, and outgoings disclosure.
- Employment and contracting: Fair Work Act 2010 (Cth) considerations and the distinction between employees and independent contractors.
- Privacy Act 1988 (Cth) and Australian Privacy Principles where personal information handling is involved.

Analyse the contract provided by the user and return ONLY valid JSON — no markdown, no explanation, no preamble.

Return exactly this structure:
{
  "contract_type": string or null,
  "counterparty_name": string or null,
  "start_date": "YYYY-MM-DD" or null,
  "end_date": "YYYY-MM-DD" or null,
  "renewal_date": "YYYY-MM-DD" or null,
  "notice_deadline": "YYYY-MM-DD" or null,
  "contract_value": number or null,
  "value_currency": string or null,
  "importance_score": integer 1-10 or null,
  "health_score": integer 0-100 or null,
  "risk_level": "low" or "medium" or "high" or null,
  "ai_summary": string or null,
  "risk_flags": [{"severity": "low"|"medium"|"high", "description": string}],
  "obligations_ours": [string],
  "obligations_theirs": [string],
  "cancellation_terms": string or null,
  "renewal_terms": string or null,
  "key_dates": [{"label": string, "date": "YYYY-MM-DD"}]
}

ACCURACY RULES — these override everything else:
- NEVER fabricate, guess, or infer dates, amounts, names, or terms that are not explicitly stated in the document. If a value is not in the document, use null.
- Do not calculate or assume a date from context (e.g. do not invent an end date from "12 month term" unless the start date is explicitly stated — and if you derive a date this way, say so in the related description).
- If the document is ambiguous, reflect the ambiguity in ai_summary rather than picking a value.
- All dates must be YYYY-MM-DD. Australian documents usually write dates day-first (e.g. 03/07/2026 = 3 July 2026) — interpret ambiguous numeric dates as DD/MM/YYYY.
- Amounts in Australian contracts are AUD unless the document explicitly says otherwise; set value_currency accordingly.
- contract_value: the total or headline value of the contract if explicitly stated, otherwise null. Never output 0 for "not specified".

HIGH-RISK CLAUSES — whenever ANY of the following appears in the document, you MUST add a risk_flags entry for it (severity "high" unless clearly mitigated in the document), quoting or closely paraphrasing the clause:
1. Personal guarantees — any clause making a director, owner, or individual personally liable for business obligations.
2. Auto-renewal traps — automatic renewal or rollover clauses, especially with long notice windows to opt out; always surface the opt-out deadline as a key_date and notice_deadline.
3. Price escalation above CPI — fixed percentage increases greater than CPI, ratchet clauses, or open-ended "market review" increases.
4. Unlimited or uncapped liability — missing liability caps, indemnities that are broader than the other side's, or one-way indemnities.
5. IP ownership transfers — assignment of intellectual property created by the business, moral rights waivers, or licences broader than needed.
6. Make good obligations — lease clauses requiring restoration of premises to original or base-building condition; note likely cost exposure.
7. Restraint of trade — non-compete, non-solicitation, or exclusivity restrictions; note duration and geographic scope.
Also flag when relevant: demolition/relocation clauses in leases, bank guarantee or security deposit requirements, unilateral variation rights, termination for convenience held only by the counterparty, liquidated damages, and time-bar clauses on claims (common in construction subcontracts).

SCORING:
- importance_score: 1=trivial, 10=mission-critical. Base on value, duration, and strategic impact.
- health_score: 0=very problematic terms, 100=excellent terms for our side. Weigh the high-risk clauses above heavily.
- ai_summary: 3-4 plain English sentences for a small business owner with no legal background. Mention the single most important risk and the single most important date. Never claim certainty or completeness — this is an aid, not legal advice.
- key_dates: include every significant date — start, end, renewal, option exercise windows, notice deadlines, payment dates, rent reviews, defects liability period end, milestones.`

// ── Response validation ───────────────────────────────────────────────────────
// Claude's JSON is untrusted input: coerce every field to its expected shape
// and drop anything malformed instead of writing it to the database.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function asDate(v: unknown): string | null {
  const s = asString(v)
  if (!s || !DATE_RE.test(s) || isNaN(new Date(s).getTime())) return null
  return s
}

function asNumber(v: unknown, min?: number, max?: number): number | null {
  if (typeof v !== 'number' || !isFinite(v)) return null
  if (min !== undefined && v < min) return null
  if (max !== undefined && v > max) return null
  return v
}

function asRiskLevel(v: unknown): 'low' | 'medium' | 'high' | null {
  return v === 'low' || v === 'medium' || v === 'high' ? v : null
}

function asStringArray(v: unknown, maxItems = 50): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, maxItems)
}

function validateAnalysis(raw: unknown): AiAnalysis {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    contract_type: asString(r.contract_type),
    counterparty_name: asString(r.counterparty_name),
    start_date: asDate(r.start_date),
    end_date: asDate(r.end_date),
    renewal_date: asDate(r.renewal_date),
    notice_deadline: asDate(r.notice_deadline),
    contract_value: asNumber(r.contract_value, 0),
    value_currency: asString(r.value_currency),
    importance_score: asNumber(r.importance_score, 1, 10) !== null ? Math.round(asNumber(r.importance_score, 1, 10)!) : null,
    health_score: asNumber(r.health_score, 0, 100) !== null ? Math.round(asNumber(r.health_score, 0, 100)!) : null,
    risk_level: asRiskLevel(r.risk_level),
    ai_summary: asString(r.ai_summary),
    risk_flags: Array.isArray(r.risk_flags)
      ? r.risk_flags
          .map(f => {
            const flag = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>
            const severity = asRiskLevel(flag.severity)
            const description = asString(flag.description)
            return severity && description ? { severity, description } : null
          })
          .filter((f): f is { severity: 'low' | 'medium' | 'high'; description: string } => f !== null)
          .slice(0, 50)
      : [],
    obligations_ours: asStringArray(r.obligations_ours),
    obligations_theirs: asStringArray(r.obligations_theirs),
    cancellation_terms: asString(r.cancellation_terms),
    renewal_terms: asString(r.renewal_terms),
    key_dates: Array.isArray(r.key_dates)
      ? r.key_dates
          .map(kd => {
            const item = (kd && typeof kd === 'object' ? kd : {}) as Record<string, unknown>
            const label = asString(item.label)
            const date = asDate(item.date)
            return label && date ? { label, date } : null
          })
          .filter((kd): kd is { label: string; date: string } => kd !== null)
          .slice(0, 100)
      : [],
  }
}

function getStatus(endDate: string | null): string {
  if (!endDate) return 'active'
  const daysLeft = Math.floor((new Date(endDate).getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 30) return 'expiring_soon'
  return 'active'
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json().catch(() => null)
  const { filePath, fileName } = (body ?? {}) as { filePath?: unknown; fileName?: unknown }

  // Validate inputs
  if (typeof filePath !== 'string' || typeof fileName !== 'string' || !filePath.trim() || !fileName.trim()) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  // Ensure the file belongs to the authenticated user.
  // Reject path-traversal segments too: although Storage keys are literal and
  // download runs under the user's own session (storage RLS applies), a crafted
  // key like "<uid>/../<other-uid>/f.pdf" still passes a naive prefix check, so
  // we block ".." and backslashes as defence-in-depth.
  if (
    !filePath.startsWith(`${user.id}/`) ||
    filePath.includes('..') ||
    filePath.includes('\\')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  // Validate file extension server-side
  const lower = fileName.toLowerCase()
  if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
    return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 })
  }

  // Load the user's plan + scan history (also used for AI personalisation below)
  const { data: userProfile } = await supabase
    .from('users')
    .select('plan_tier, free_scan_reset_at, personalisation_context')
    .eq('id', user.id)
    .single()

  const planTier = ((userProfile?.plan_tier as PlanTier | undefined) ?? 'free')
  const planLimit = PLAN_LIMITS[planTier] ?? null

  // Free tier: enforce one scan per 30 days (server-side)
  if (planTier === 'free' && userProfile?.free_scan_reset_at) {
    const elapsed = Date.now() - new Date(userProfile.free_scan_reset_at).getTime()
    if (elapsed < FREE_SCAN_INTERVAL_MS) {
      const daysLeft = Math.ceil((FREE_SCAN_INTERVAL_MS - elapsed) / 86400000)
      return NextResponse.json(
        { error: `Your free scan resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to scan anytime.` },
        { status: 402 }
      )
    }
  }

  // Plan contract-limit + 24h abuse safeguard. Run in parallel to save a round-trip.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [planLimitRes, recentRes] = await Promise.all([
    planLimit !== null
      ? admin.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      : Promise.resolve({ count: 0 as number | null }),
    admin.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', oneDayAgo),
  ])

  if (planLimit !== null && (planLimitRes.count ?? 0) >= planLimit) {
    return NextResponse.json(
      { error: `You've reached your plan's limit of ${planLimit} contract${planLimit === 1 ? '' : 's'}. Upgrade to add more.` },
      { status: 402 }
    )
  }

  if ((recentRes.count ?? 0) >= 10) {
    return NextResponse.json(
      { error: 'Daily analysis limit reached (10 per day). Please try again tomorrow.' },
      { status: 429 }
    )
  }

  // 1. Download from Supabase Storage
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from('contracts')
    .download(filePath)

  if (downloadError || !fileBlob) {
    console.error('[analyze] Storage download error:', downloadError)
    return NextResponse.json({ error: 'Failed to retrieve uploaded file' }, { status: 500 })
  }

  // 2. Extract text
  let extractedText = ''
  const buffer = Buffer.from(await fileBlob.arrayBuffer())

  try {
    if (lower.endsWith('.pdf')) {
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default
      const result = await pdf(buffer)
      extractedText = result.text
    } else {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }
  } catch (err) {
    console.error('[analyze] Text extraction error:', err)
    return NextResponse.json(
      { error: 'Could not extract text from this document. If it is a scanned image, it cannot be processed.' },
      { status: 422 }
    )
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: 'No readable text found in this document' },
      { status: 422 }
    )
  }

  // 3. Analyse with Claude. The static instructions go in a cached system block;
  //    the assistant turn is prefilled with "{" to force clean JSON output.
  const userContext = userProfile?.personalisation_context

  let analysis: AiAnalysis
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_INSTRUCTIONS, cache_control: { type: 'ephemeral' } },
      ],
      messages: [
        {
          role: 'user',
          content: `${userContext ? `User context:\n${userContext}\n\n` : ''}Contract text:\n${extractedText.slice(0, 300000)}`,
        },
        { role: 'assistant', content: '{' },
      ],
    })

    if (message.stop_reason === 'max_tokens') {
      console.error('[analyze] Response truncated at max_tokens')
      throw new Error('Response truncated')
    }

    const block = message.content[0]
    const raw = block && block.type === 'text' ? block.text : ''
    // Re-add the prefilled "{" and parse.
    const jsonText = `{${raw}`
    const match = jsonText.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error('[analyze] No JSON found in response. Raw:', raw.slice(0, 500))
      throw new Error('No JSON in response')
    }
    // Validate every field before it touches the database — malformed or
    // unexpected values from the model are dropped, not saved.
    analysis = validateAnalysis(JSON.parse(match[0]))
  } catch (err) {
    console.error('[analyze] AI error:', err)
    return NextResponse.json({ error: 'AI analysis failed — please try again' }, { status: 500 })
  }

  // 4. Save contract
  const contractName = analysis.counterparty_name
    ? `${analysis.contract_type ?? 'Contract'} — ${analysis.counterparty_name}`
    : (analysis.contract_type ?? fileName)

  const { data: contract, error: insertError } = await admin
    .from('contracts')
    .insert({
      user_id: user.id,
      file_name: fileName,
      file_url: filePath,
      contract_name: contractName,
      counterparty_name: analysis.counterparty_name,
      contract_type: analysis.contract_type,
      status: getStatus(analysis.end_date),
      start_date: analysis.start_date,
      end_date: analysis.end_date,
      renewal_date: analysis.renewal_date,
      notice_deadline: analysis.notice_deadline,
      contract_value: analysis.contract_value,
      // Australian product: amounts without an explicit currency are AUD
      value_currency: analysis.value_currency ?? (analysis.contract_value !== null ? 'AUD' : null),
      value_extracted: analysis.contract_value !== null,
      importance_score: analysis.importance_score,
      health_score: analysis.health_score,
      risk_level: analysis.risk_level,
      ai_summary: analysis.ai_summary,
      ai_analysis_json: analysis,
    })
    .select('id')
    .single()

  if (insertError || !contract) {
    console.error('[analyze] Contract insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save contract — please try again' }, { status: 500 })
  }

  // 5. Free tier: mark the scan server-side so the 30-day window can't be skipped
  if (planTier === 'free') {
    await admin
      .from('users')
      .update({ free_scan_reset_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  // 6. Insert contract_events for key_dates
  const validDates = (analysis.key_dates ?? []).filter(kd => kd.date && kd.label)
  if (validDates.length) {
    await admin.from('contract_events').insert(
      validDates.map(kd => ({
        contract_id: contract.id,
        user_id: user.id,
        event_type: 'key_date',
        event_date: kd.date,
        event_label: kd.label,
      }))
    )
  }

  return NextResponse.json({ contractId: contract.id })
}
