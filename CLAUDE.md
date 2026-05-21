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
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Email:** Resend
- **Payments:** Stripe

## Dev commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # type check only
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
  (app)/          # main app shell with sidebar
    layout.tsx    # sidebar + content wrapper
    dashboard/
    vault/
    upload/
    settings/
  layout.tsx      # root layout (Inter font, dark class)
  page.tsx        # redirects / → /dashboard

components/
  sidebar.tsx     # fixed left nav, client component

lib/supabase/
  client.ts       # browser client (createBrowserClient)
  server.ts       # server client (createServerClient + cookies)

middleware.ts     # session refresh + route protection
```

Middleware protects `/dashboard`, `/vault`, `/upload`, `/settings`, `/contracts`. Unauthenticated users are redirected to `/login`. Authenticated users hitting auth pages are redirected to `/dashboard`.

## Environment variables

Required in `.env.local` (never committed):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Git workflow

After every meaningful change: commit with a clear message and push to `origin master`. `gh` is at `C:\Program Files\GitHub CLI\gh.exe` if not on PATH.
