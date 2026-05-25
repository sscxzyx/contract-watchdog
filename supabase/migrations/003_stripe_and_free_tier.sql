-- Migration 003: Stripe integration + free tier
-- Run this in the Supabase SQL editor

-- ── 1. Update plan_tier on users ─────────────────────────────────────────────

-- Drop old check constraint and add free tier
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_plan_tier_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_plan_tier_check
    CHECK (plan_tier IN ('free', 'starter', 'business', 'agency'));

-- Change default to free (new signups get free tier)
ALTER TABLE public.users
  ALTER COLUMN plan_tier SET DEFAULT 'free';

-- ── 2. New columns on users ───────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS free_scan_reset_at timestamptz;

-- ── 3. Columns that may be missing from earlier manual setup ─────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS business_type text
    CHECK (business_type IN ('sole_trader', 'partnership', 'company', 'trust')),
  ADD COLUMN IF NOT EXISTS contract_volume text
    CHECK (contract_volume IN ('1-5', '5-20', '20-50', '50+')),
  ADD COLUMN IF NOT EXISTS contract_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS biggest_headache text,
  ADD COLUMN IF NOT EXISTS caught_out text,
  ADD COLUMN IF NOT EXISTS personalisation_context text;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notification_preference text NOT NULL DEFAULT 'email_only'
    CHECK (notification_preference IN ('email_only', 'email_sms', 'in_app_only')),
  ADD COLUMN IF NOT EXISTS phone_number text;

-- ── 4. Update trigger so new signups get free tier ───────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, plan_tier)
  VALUES (new.id, new.email, 'free');

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
