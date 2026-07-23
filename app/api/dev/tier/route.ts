import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDevAccount } from '@/lib/dev'

const TIERS = ['free', 'starter', 'business', 'agency'] as const

// Dev-only: lets the designated preview account switch its own plan tier so
// every tier's experience can be inspected without touching Stripe. plan_tier
// is service-role-only at the column level (migration 005), hence this route.
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isDevAccount(user.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null) as { tier?: string } | null
  const tier = body?.tier
  if (!tier || !TIERS.includes(tier as typeof TIERS[number])) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ plan_tier: tier })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to switch tier' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tier })
}
