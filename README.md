# Goal Garden

A motivating dark-mode goal tracker built with **Next.js (App Router)**, **Tailwind CSS**, and **Supabase**. Break big goals into AI-generated weekly milestones and daily micro-tasks, watch an animated progress tree grow, avoid calendar conflicts, and reschedule missed work without guilt.

## Features

- **Auth** — email/password via Supabase (demo mode works offline with localStorage)
- **Goals schema** — goals → milestones → daily tasks with RLS
- **AI planning** — SpaceXAI/xAI (`XAI_API_KEY`) or deterministic mock planner
- **Progress tree** — SVG sapling → fruiting tree with smooth animations
- **Calendar** — FullCalendar + mock/Google/Outlook busy slots + free-day suggestions
- **Smart reschedule** — detect missed tasks, shift to free days, encouraging copy
- **Sunday review** — completed vs missed summary, suggestions, reflection notes
- **Task UX** — live toggles, editable titles, progress %, streaks, archive
- **Demo data** — “Launch a side project in 8 weeks” sample plan
- **Responsive** dark UI with sidebar navigation, loading & error states

## Quick start

```bash
cd goal-garden
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars the app runs in **demo mode**: any email/password signs you in and data lives in `localStorage`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Put URL + anon key in `.env.local`.
3. Run `supabase/schema.sql` in the SQL editor (tables, RLS, profile trigger).
4. Auth → enable Email provider (turn off email confirm for local dev if you like).

## AI planning (SpaceXAI / xAI)

```env
XAI_API_KEY=your-key-from-console.x.ai
```

Uses OpenAI-compatible API at `https://api.x.ai/v1` with model `grok-4.5`.  
If the key is missing (or `USE_MOCK_AI=true`), a local mock generator builds 3–5 milestones and 3–7 tasks each.

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `XAI_API_KEY` | Server-side plan generation |
| `USE_MOCK_AI` | Force mock planner |
| `NEXT_PUBLIC_DEMO_MODE` | Force local demo auth/storage |

## Project structure

```
src/
  app/
    api/generate-plan|reschedule|calendar/busy|seed-demo
    dashboard/          # main app shell
    login|signup/
  components/           # UI (tree, calendar, modals, …)
  hooks/useGoals.ts
  lib/                  # AI, calendar, reschedule, Supabase, demo data
supabase/schema.sql
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Notes

- **Calendar OAuth**: Settings lets you pick Google/Outlook; `/api/calendar/busy` returns simulated busy slots until you wire real OAuth tokens.
- **Archiving**: goals auto-archive when every task is complete; you can also archive manually.
- **Streaks**: increment when you complete at least one task on consecutive days (demo/local store).
