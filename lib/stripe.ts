import Stripe from 'stripe'
import type { PlanTier } from '@/types/database'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  business: process.env.STRIPE_PRICE_BUSINESS!,
  agency: process.env.STRIPE_PRICE_AGENCY!,
}

export const TRIAL_DAYS: Partial<Record<PlanTier, number>> = {
  starter: 14,
  business: 14,
}

export function tierFromPriceId(priceId: string): PlanTier | null {
  const entry = Object.entries(PRICE_IDS).find(([, id]) => id === priceId)
  return entry ? (entry[0] as PlanTier) : null
}
