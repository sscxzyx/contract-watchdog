import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Called by Vercel Cron or any scheduler — protected by CRON_SECRET
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const today = new Date()
  let sent = 0
  let skipped = 0

  // Get all users with email alerts enabled
  const { data: settings } = await supabase
    .from('user_settings')
    .select('user_id, alert_days_before, email_alerts_enabled, extra_recipients')
    .eq('email_alerts_enabled', true)

  if (!settings?.length) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'No users with alerts enabled' })
  }

  for (const row of settings) {
    const alertDays = (row.alert_days_before as number[]) ?? [90, 60, 30, 14, 7]
    const extraRecipients = (row.extra_recipients as string[]) ?? []

    // Fetch user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id as string)
    if (!user?.email) continue

    const recipients = [user.email, ...extraRecipients]

    for (const days of alertDays) {
      const target = new Date(today)
      target.setDate(target.getDate() + days)
      const targetDate = target.toISOString().split('T')[0]

      const { data: events } = await supabase
        .from('contract_events')
        .select('id, contract_id, event_label, event_date, contracts(contract_name)')
        .eq('user_id', row.user_id)
        .eq('event_date', targetDate)

      if (!events?.length) continue

      for (const event of events) {
        // Dedup: skip if we already sent this alert
        const { data: existing } = await supabase
          .from('alerts_log')
          .select('id')
          .eq('contract_id', event.contract_id)
          .eq('alert_type', event.event_label)
          .eq('days_before', days)
          .maybeSingle()

        if (existing) { skipped++; continue }

        const contractName = (event.contracts as { contract_name?: string } | null)?.contract_name ?? 'Your contract'
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://controva.co'

        try {
          await resend.emails.send({
            from: 'Controva <alerts@controva.co>',
            to: recipients,
            subject: `${event.event_label} in ${days} day${days !== 1 ? 's' : ''} — ${contractName}`,
            html: buildEmailHtml({ contractName, eventLabel: event.event_label as string, days, eventDate: event.event_date as string, contractId: event.contract_id as string, siteUrl }),
          })

          await supabase.from('alerts_log').insert({
            contract_id: event.contract_id,
            user_id: row.user_id,
            alert_type: event.event_label,
            days_before: days,
          })

          sent++
        } catch {
          // Log but don't abort — one failed email shouldn't stop the rest
        }
      }
    }
  }

  return NextResponse.json({ sent, skipped })
}

function buildEmailHtml({ contractName, eventLabel, days, eventDate, contractId, siteUrl }: {
  contractName: string
  eventLabel: string
  days: number
  eventDate: string
  contractId: string
  siteUrl: string
}) {
  const formatted = new Date(eventDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const dot = days <= 7 ? '#f87171' : days <= 14 ? '#fbbf24' : '#4ade80'
  const urgency = days <= 7 ? 'Urgent Alert' : days <= 14 ? 'Reminder' : 'Upcoming Deadline'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <span style="color:white;font-weight:600;font-size:16px">Controva</span>
    </div>

    <div style="background:#111111;border:1px solid #27272a;border-radius:12px;padding:28px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <div style="width:8px;height:8px;background:${dot};border-radius:50%"></div>
        <span style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">${urgency}</span>
      </div>

      <h1 style="color:white;font-size:20px;font-weight:600;margin:0 0 8px 0;line-height:1.3">
        ${eventLabel} in ${days} day${days !== 1 ? 's' : ''}
      </h1>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 8px 0;line-height:1.6">
        <strong style="color:white">${contractName}</strong>
      </p>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px 0">Due date: <strong style="color:white">${formatted}</strong></p>

      <a href="${siteUrl}/contracts/${contractId}"
         style="display:inline-block;background:#6366f1;color:white;text-decoration:none;font-size:14px;font-weight:500;padding:10px 20px;border-radius:8px">
        View Contract →
      </a>
    </div>

    <p style="color:#52525b;font-size:12px;text-align:center;margin-top:24px;line-height:1.6">
      You're receiving this because email alerts are enabled on your Controva account.<br>
      <a href="${siteUrl}/settings" style="color:#6366f1;text-decoration:none">Manage notification preferences</a>
    </p>
  </div>
</body>
</html>`
}
