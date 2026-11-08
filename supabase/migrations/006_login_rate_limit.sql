-- Migration 006: Login rate limiting / account lockout
-- Run this in the Supabase SQL editor after 001–005
--
-- Tracks failed password attempts per email. After 5 consecutive failures the
-- account is locked for 24 hours. Rows are read/written ONLY by the server-side
-- login route using the service-role key (see app/api/auth/login/route.ts) — no
-- browser client should ever see or touch this table, hence RLS with no policies.

CREATE TABLE IF NOT EXISTS public.login_attempts (
  email          text PRIMARY KEY,
  failed_count   integer     NOT NULL DEFAULT 0,
  first_failed_at timestamptz NOT NULL DEFAULT now(),
  last_failed_at timestamptz NOT NULL DEFAULT now(),
  locked_until   timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS with NO policies → denies all access to anon/authenticated roles.
-- The service role bypasses RLS, so the admin client can still read/write.
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.login_attempts FROM anon, authenticated;

-- Lets the lockout cleanup query stay fast if you ever prune expired rows.
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until
  ON public.login_attempts (locked_until);
