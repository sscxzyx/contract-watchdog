import { NextResponse } from 'next/server'
import { getStripe, tierFromPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0]?.price.id
    const customerId = sub.customer as string
    const tier = tierFromPriceId(priceId)

    if (tier) {
      await admin.from('users').update({
        plan_tier: tier,
        stripe_subscription_id: sub.id,
      }).eq('stripe_customer_id', customerId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    await admin.from('users').update({
      plan_tier: 'free',
      stripe_subscription_id: null,
    }).eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
