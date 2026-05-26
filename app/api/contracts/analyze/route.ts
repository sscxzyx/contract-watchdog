import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import type { AiAnalysis } from '@/types/database'

export const runtime = 'nodejs'
export const maxDuration = 60

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[analyze] ANTHROPIC_API_KEY is not set')
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  // Rate limit: max 10 analyses per 24 hours per user
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneDayAgo)

  if ((recentCount ?? 0) >= 10) {
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
    } else if (lower.endsWith('.docx')) {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 })
    }
  } catch {
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

  // 3. Analyse with Claude (inject user personalisation context if available)
  const { data: userProfile } = await supabase
    .from('users')
    .select('personalisation_context')
    .eq('id', user.id)
    .single()

  const userContext = userProfile?.personalisation_context

  let analysis: AiAnalysis
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `${userContext ? `User context:\n${userContext}\n\n` : ''}Analyse the following contract and return ONLY valid JSON — no markdown, no explanation, no preamble.

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
- key_dates: include every significant date — start, end, renewal, notice deadlines, payment dates, milestones.

Contract text:
${extractedText.slice(0, 80000)}`,
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    // Strip markdown code fences if Claude wrapped the JSON
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const match = stripped.match(/\{[\s\S]*\}/)
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

  const { data: contract, error: insertError } = await supabase
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
    return NextResponse.json({ error: 'Failed to save contract — please try again' }, { status: 500 })
  }

  // 5. Insert contract_events for key_dates
  const validDates = (analysis.key_dates ?? []).filter(kd => kd.date && kd.label)
  if (validDates.length) {
    await supabase.from('contract_events').insert(
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
