import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, PRICE_IDS, TRIAL_DAYS } from '@/lib/stripe'
import type { PlanTier } from '@/types/database'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanTier }
  if (!PRICE_IDS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('stripe_customer_id, email').eq('id', user.id).single()

  // Find or create Stripe customer
  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: profile?.email ?? user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const trialDays = TRIAL_DAYS[plan]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,
    success_url: `${siteUrl}/settings?upgraded=true`,
    cancel_url: `${siteUrl}/settings`,
    metadata: { supabase_user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
