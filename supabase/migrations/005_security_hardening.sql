-- Migration 005: Security hardening, missing indexes, data fixes
-- Run this in the Supabase SQL editor after 001–004

-- ── 1. Column-level privileges on public.users ────────────────────────────────
-- The "users: update own" RLS policy restricts WHICH ROWS a user can update,
-- but not WHICH COLUMNS. Without this, any signed-in user could set their own
-- plan_tier to 'agency' (or clear free_scan_reset_at / stripe ids) from the
-- browser console. Only the service role may touch billing columns.

REVOKE UPDATE ON TABLE public.users FROM authenticated, anon;

GRANT UPDATE (
  full_name,
  company_name,
  industry,
  business_type,
  contract_volume,
  contract_types,
  biggest_headache,
  caught_out,
  personalisation_context,
  onboarding_complete
) ON TABLE public.users TO authenticated;

-- ── 2. Restore full_name capture in signup trigger ───────────────────────────
-- Migration 004 replaced the trigger from 003 and accidentally dropped the
-- full_name assignment, so email/password signups lost their name.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, plan_tier)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'free');

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Storage bucket limits ──────────────────────────────────────────────────
-- The 25 MB / PDF+DOCX limits were only enforced client-side. Enforce them at
-- the bucket so a crafted client can't upload arbitrary files or sizes.

UPDATE storage.buckets
SET
  file_size_limit = 26214400, -- 25 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
WHERE id = 'contracts';

-- ── 4. Indexes on frequently queried columns ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contracts_user_created
  ON public.contracts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status
  ON public.contracts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_events_user_date
  ON public.contract_events (user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_contract_events_contract
  ON public.contract_events (contract_id);
CREATE INDEX IF NOT EXISTS idx_alerts_log_dedup
  ON public.alerts_log (contract_id, alert_type, days_before);
CREATE INDEX IF NOT EXISTS idx_alerts_log_user
  ON public.alerts_log (user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users (stripe_customer_id);

-- ── 5. Default currency is AUD, not USD ───────────────────────────────────────

ALTER TABLE public.contracts
  ALTER COLUMN value_currency SET DEFAULT 'AUD';
