import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// Lock an account after this many consecutive failed password attempts…
const MAX_ATTEMPTS = 5
// …for this long (24 hours, in ms).
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Email and password are required.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const now = Date.now()

  // ── 1. Is this account currently locked out? ────────────────────────────────
  const { data: record } = await admin
    .from('login_attempts')
    .select('failed_count, locked_until')
    .eq('email', email)
    .maybeSingle()

  const lockedUntilMs = record?.locked_until
    ? new Date(record.locked_until).getTime()
    : 0

  if (lockedUntilMs > now) {
    return NextResponse.json(
      {
        error: 'locked',
        lockedUntil: new Date(lockedUntilMs).toISOString(),
        message: lockoutMessage(lockedUntilMs - now),
      },
      { status: 429 }
    )
  }

  // A previously-expired lock (or first-ever attempt) starts a fresh count.
  const priorCount = lockedUntilMs > 0 ? 0 : record?.failed_count ?? 0

  // ── 2. Attempt the sign-in (this sets the Supabase auth cookies on success) ──
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // ── 3a. Success → clear any failure history and let them in. ─────────────────
  if (!error) {
    await admin.from('login_attempts').delete().eq('email', email)
    return NextResponse.json({ ok: true })
  }

  // Only wrong-password failures count toward the lockout. Other auth errors
  // (e.g. "Email not confirmed") pass straight through without penalising.
  const isBadCredentials =
    error.code === 'invalid_credentials' ||
    /invalid login credentials/i.test(error.message)

  if (!isBadCredentials) {
    return NextResponse.json(
      { error: 'auth', message: error.message },
      { status: 401 }
    )
  }

  // ── 3b. Wrong password → record the attempt, lock if the limit is reached. ───
  const newCount = priorCount + 1
  const nowIso = new Date(now).toISOString()
  const willLock = newCount >= MAX_ATTEMPTS
  const newLockedUntil = willLock ? new Date(now + LOCK_DURATION_MS).toISOString() : null

  await admin.from('login_attempts').upsert(
    {
      email,
      failed_count: newCount,
      last_failed_at: nowIso,
      locked_until: newLockedUntil,
      updated_at: nowIso,
      // Keep first_failed_at anchored to the start of the current streak.
      ...(priorCount === 0 ? { first_failed_at: nowIso } : {}),
    },
    { onConflict: 'email' }
  )

  if (willLock) {
    // Fire the "was this you?" alert to the real account owner. Don't let an
    // email hiccup break the login response — just log it.
    try {
      await sendLockoutAlert(admin, email, request)
    } catch (err) {
      console.error('[auth/login] Failed to send lockout alert:', err)
    }

    return NextResponse.json(
      {
        error: 'locked',
        lockedUntil: newLockedUntil,
        message: lockoutMessage(LOCK_DURATION_MS),
      },
      { status: 429 }
    )
  }

  const remaining = MAX_ATTEMPTS - newCount
  return NextResponse.json(
    {
      error: 'invalid',
      remaining,
      message: `Incorrect email or password. ${remaining} attempt${
        remaining === 1 ? '' : 's'
      } remaining before your account is locked for 24 hours.`,
    },
    { status: 401 }
  )
}

function lockoutMessage(msRemaining: number): string {
  const hours = Math.ceil(msRemaining / (60 * 60 * 1000))
  return `Too many failed attempts. Your account is locked. Try again in about ${hours} hour${
    hours === 1 ? '' : 's'
  }.`
}

// ── Security alert email ──────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>

async function sendLockoutAlert(admin: AdminClient, email: string, request: Request) {
  if (!process.env.RESEND_API_KEY) return

  // Only email a real account owner. If no account matches, the attempt was for
  // a non-existent email — stay quiet rather than spam a stranger.
  const { data: account } = await admin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (!account) return

  const device = parseUserAgent(request.headers.get('user-agent'))
  const location = getLocation(request.headers)
  const ip = getClientIp(request.headers)
  const when = new Date().toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Brisbane',
  })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://controva.co'

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Controva <alerts@controva.co>',
    to: email,
    subject: 'Security alert: your Controva account was locked after failed sign-ins',
    html: buildLockoutEmailHtml({ device, location, ip, when, siteUrl }),
  })
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'an unknown device'

  const os = /Windows/i.test(ua)
    ? 'Windows'
    : /iPhone|iPad|iOS/i.test(ua)
    ? 'iOS'
    : /Mac OS X|Macintosh/i.test(ua)
    ? 'macOS'
    : /Android/i.test(ua)
    ? 'Android'
    : /Linux/i.test(ua)
    ? 'Linux'
    : 'an unknown OS'

  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/i.test(ua)
    ? 'Opera'
    : /Chrome\//i.test(ua)
    ? 'Chrome'
    : /Firefox\//i.test(ua)
    ? 'Firefox'
    : /Safari\//i.test(ua)
    ? 'Safari'
    : 'an unknown browser'

  return `${browser} on ${os}`
}

// Vercel attaches approximate geo-IP data to every incoming request header.
function getLocation(headers: Headers): string {
  const decode = (v: string | null) => {
    if (!v) return ''
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  }
  const city = decode(headers.get('x-vercel-ip-city'))
  const region = decode(headers.get('x-vercel-ip-country-region'))
  const country = decode(headers.get('x-vercel-ip-country'))

  const parts = [city, region, country].filter(Boolean)
  return parts.length ? parts.join(', ') : 'an unknown location'
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildLockoutEmailHtml({ device, location, ip, when, siteUrl }: {
  device: string
  location: string
  ip: string
  when: string
  siteUrl: string
}) {
  // device/location/ip derive from request headers (attacker-controlled) — escape.
  const safeDevice = escapeHtml(device)
  const safeLocation = escapeHtml(location)
  const safeIp = escapeHtml(ip)
  const safeWhen = escapeHtml(when)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F1115;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:#4ADE80;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1115" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <span style="color:#F2F0EB;font-weight:600;font-size:16px">Controva</span>
    </div>

    <div style="background:#171A21;border:1px solid #262A33;border-radius:12px;padding:28px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <div style="width:8px;height:8px;background:#E5484D;border-radius:50%"></div>
        <span style="color:#9BA1AC;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Security Alert</span>
      </div>

      <h1 style="color:#F2F0EB;font-size:20px;font-weight:600;margin:0 0 8px 0;line-height:1.3">
        We locked your account after 5 failed sign-in attempts
      </h1>
      <p style="color:#9BA1AC;font-size:14px;margin:0 0 20px 0;line-height:1.6">
        For your protection, sign-in is disabled for 24 hours. Here's what we saw:
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="color:#9BA1AC;font-size:13px;padding:6px 0;width:90px">When</td>
          <td style="color:#F2F0EB;font-size:13px;padding:6px 0">${safeWhen}</td>
        </tr>
        <tr>
          <td style="color:#9BA1AC;font-size:13px;padding:6px 0">Device</td>
          <td style="color:#F2F0EB;font-size:13px;padding:6px 0">${safeDevice}</td>
        </tr>
        <tr>
          <td style="color:#9BA1AC;font-size:13px;padding:6px 0">Location</td>
          <td style="color:#F2F0EB;font-size:13px;padding:6px 0">${safeLocation}</td>
        </tr>
        <tr>
          <td style="color:#9BA1AC;font-size:13px;padding:6px 0">IP address</td>
          <td style="color:#F2F0EB;font-size:13px;padding:6px 0">${safeIp}</td>
        </tr>
      </table>

      <p style="color:#9BA1AC;font-size:14px;margin:0 0 20px 0;line-height:1.6">
        <strong style="color:#F2F0EB">Was this you?</strong> If so, you can ignore this email — your
        account will unlock automatically in 24 hours.
      </p>
      <p style="color:#9BA1AC;font-size:14px;margin:0 0 24px 0;line-height:1.6">
        <strong style="color:#F2F0EB">Don't recognise this?</strong> Someone may be trying to guess your
        password. We recommend resetting it now.
      </p>

      <a href="${siteUrl}/forgot-password"
         style="display:inline-block;background:#4ADE80;color:#0F1115;text-decoration:none;font-size:14px;font-weight:500;padding:10px 20px;border-radius:8px">
        Reset my password →
      </a>
    </div>

    <p style="color:#9BA1AC;font-size:12px;text-align:center;margin-top:24px;line-height:1.6">
      Location and device are approximate, based on network information, and may not be exact.<br>
      You're receiving this because someone attempted to sign in to your Controva account.
    </p>
  </div>
</body>
</html>`
}
