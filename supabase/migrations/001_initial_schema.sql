-- Controva initial schema
-- Run this in the Supabase SQL editor for your project

-- ─────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  company_name text,
  industry text,
  plan_tier text not null default 'starter'
    check (plan_tier in ('starter', 'business', 'agency')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  contract_name text not null,
  counterparty_name text,
  contract_type text,
  status text not null default 'active'
    check (status in ('active', 'expiring_soon', 'expired', 'needs_review')),
  start_date date,
  end_date date,
  renewal_date date,
  notice_deadline date,
  contract_value numeric(15,2),
  value_currency text default 'USD',
  value_extracted boolean not null default false,
  importance_score integer check (importance_score between 1 and 10),
  health_score integer check (health_score between 0 and 100),
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  ai_summary text,
  ai_analysis_json jsonb,
  created_at timestamptz not null default now()
);

create table public.contract_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  event_date date not null,
  event_label text not null,
  created_at timestamptz not null default now()
);

create table public.alerts_log (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  sent_at timestamptz not null default now(),
  alert_type text not null,
  days_before integer not null
);

create table public.user_settings (
  user_id uuid references public.users(id) on delete cascade primary key,
  alert_days_before integer[] not null default '{90,60,30,14,7}',
  email_alerts_enabled boolean not null default true,
  extra_recipients text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────

alter table public.users enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_events enable row level security;
alter table public.alerts_log enable row level security;
alter table public.user_settings enable row level security;

-- users
create policy "users: select own" on public.users
  for select using (auth.uid() = id);
create policy "users: update own" on public.users
  for update using (auth.uid() = id);

-- contracts
create policy "contracts: select own" on public.contracts
  for select using (auth.uid() = user_id);
create policy "contracts: insert own" on public.contracts
  for insert with check (auth.uid() = user_id);
create policy "contracts: update own" on public.contracts
  for update using (auth.uid() = user_id);
create policy "contracts: delete own" on public.contracts
  for delete using (auth.uid() = user_id);

-- contract_events
create policy "contract_events: select own" on public.contract_events
  for select using (auth.uid() = user_id);
create policy "contract_events: insert own" on public.contract_events
  for insert with check (auth.uid() = user_id);
create policy "contract_events: delete own" on public.contract_events
  for delete using (auth.uid() = user_id);

-- alerts_log
create policy "alerts_log: select own" on public.alerts_log
  for select using (auth.uid() = user_id);
create policy "alerts_log: insert own" on public.alerts_log
  for insert with check (auth.uid() = user_id);

-- user_settings
create policy "user_settings: select own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings: insert own" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings: update own" on public.user_settings
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
