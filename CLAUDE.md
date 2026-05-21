# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ClauseGuard — an AI-powered contract monitoring platform for small businesses. Built as a SaaS web app with subscription tiers.

**GitHub:** https://github.com/sscxzyx/contract-watchdog  
**Local path:** `C:\Users\jaime\contract watchdog`

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript strict mode
- **Styling:** Tailwind CSS with custom design tokens
- **Database/Auth:** Supabase (Postgres, Auth, Storage)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`)
- **Email:** Resend (`app/api/cron/alerts/route.ts`)
- **Payments:** Stripe (Phase 8 — not yet wired)

## Dev commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # type check only
```

## Environment variables

Required in `.env.local` (never committed):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
ANTHROPIC_API_KEY=       # from console.anthropic.com
RESEND_API_KEY=          # from resend.com
SUPABASE_SERVICE_ROLE_KEY=  # from Supabase project settings → API
CRON_SECRET=             # any random string, used to secure the cron endpoint
```

## Design system

Dark SaaS — think Linear/Vercel dashboard. Custom Tailwind tokens:
- `bg-background` → `#0a0a0a` (page background)
- `bg-surface` → `#111111` (cards, sidebar)
- `bg-surface-elevated` → `#1a1a1a`
- `border-[#27272a]` (borders)
- `text-[#a1a1aa]` (muted text)
- `bg-accent` / `text-accent` → `#6366f1` (indigo, primary CTA)

## Architecture

```
app/
  (auth)/         # login, signup — no sidebar
  (app)/          # main app shell with sidebar + mobile top bar
    layout.tsx    # sidebar + responsive content wrapper
    dashboard/    # portfolio health, alerts, timeline, loading.tsx
    vault/        # contract grid/list with search/filter/sort
    upload/       # drag-drop upload + tier enforcement modal
    settings/     # profile, notifications, billing, account, loading.tsx
    contracts/[id]/  # detail page (server) + ContractDetailClient + loading.tsx
  api/
    contracts/analyze/  # Claude AI analysis pipeline
    cron/alerts/        # email alert cron (needs SUPABASE_SERVICE_ROLE_KEY)
  auth/callback/  # OAuth code exchange

components/
  sidebar.tsx          # responsive: fixed desktop, hamburger drawer mobile
  OnboardingWizard.tsx # 3-step first-login flow

lib/supabase/
  client.ts   # browser client
  server.ts   # server client (cookies)
  admin.ts    # service role client (cron only — never use client-side)

types/
  database.ts   # Contract, User, ContractEvent, AlertLog, UserSettings, AiAnalysis
  pdf-parse.d.ts

supabase/migrations/
  001_initial_schema.sql  # all tables, RLS policies, handle_new_user trigger
  002_storage_policies.sql  # contracts storage bucket + object policies
```

Middleware protects `/dashboard`, `/vault`, `/upload`, `/settings`, `/contracts`. Unauthenticated → `/login`. Authenticated on auth pages → `/dashboard`.

## Subscription tiers

| Tier | Contract limit |
|------|---------------|
| starter | 5 |
| business | 25 |
| agency | unlimited |

Enforcement is in `app/(app)/upload/page.tsx` — counts contracts before allowing upload. Upgrade modal shown at limit.

## Cron alerts

`GET /api/cron/alerts` — must include `Authorization: Bearer <CRON_SECRET>` header.  
Schedule with Vercel Cron (`vercel.json`) or any external scheduler (daily is sufficient).

## Git workflow

After every phase: commit with a clear message and push to `origin master`. `gh` is at `C:\Program Files\GitHub CLI\gh.exe` if not on PATH.
