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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
const SYSTEM_INSTRUCTIONS = `You are a contract analyst for Australian small businesses. Analyse the contract provided by the user and return ONLY valid JSON — no markdown, no explanation, no preamble.

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

Rules:
- Never fabricate values. Use null if the information is not explicitly in the document.
- All dates must be YYYY-MM-DD format.
- importance_score: 1=trivial, 10=mission-critical. Base on value, duration, and strategic impact.
- health_score: 0=very problematic terms, 100=excellent terms for our side.
- ai_summary: 3-4 plain English sentences for a small business owner with no legal background.
- key_dates: include every significant date — start, end, renewal, notice deadlines, payment dates, milestones.`

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
  // Ensure the file belongs to the authenticated user
  if (!filePath.startsWith(`${user.id}/`)) {
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
          content: `${userContext ? `User context:\n${userContext}\n\n` : ''}Contract text:\n${extractedText.slice(0, 80000)}`,
        },
        { role: 'assistant', content: '{' },
      ],
    })

    const block = message.content[0]
    const raw = block && block.type === 'text' ? block.text : ''
    // Re-add the prefilled "{" and parse.
    const jsonText = `{${raw}`
    const match = jsonText.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error('[analyze] No JSON found in response. Raw:', raw.slice(0, 500))
      throw new Error('No JSON in response')
    }
    analysis = JSON.parse(match[0]) as AiAnalysis
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
      value_currency: analysis.value_currency,
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
