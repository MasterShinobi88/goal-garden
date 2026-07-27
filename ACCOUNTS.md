# Goal Garden — real accounts & Premium $7.99

## Production model

| Mode | When | Data |
|------|------|------|
| **Real accounts** | Supabase env set, `DEMO_MODE` false | Auth + goals in Supabase (any device) |
| **Desktop local** | Electron / `NEXT_PUBLIC_DESKTOP=true` | localStorage on that PC |
| **Demo** | `NEXT_PUBLIC_DEMO_MODE=true` only for local testing | Fake local session |

Live Netlify must **not** use demo mode.

## One-time Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/schema.sql` (includes RLS + Premium columns).
3. **Authentication → Providers → Email** enabled.
4. Optional: turn off “Confirm email” for faster launch testing (turn on later for security).
5. Copy **Project URL** + **anon public** key.

## Netlify environment variables

Site → **Environment variables** → add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `NEXT_PUBLIC_SITE_URL` | `https://goal-garden.netlify.app` |
| `NEXT_PUBLIC_PREMIUM_CHECKOUT_URL` | Lemon/Stripe checkout (when ready) |

Then **Trigger deploy**.

## Premium $7.99

- Price constant: `src/lib/pricing.ts` → `PREMIUM_PRICE_USD = 7.99`
- Create a **one-time** product in Lemon Squeezy or Stripe Payment Link for $7.99
- Paste checkout URL into `NEXT_PUBLIC_PREMIUM_CHECKOUT_URL`
- After purchase, either:
  - Customer enters license key in Settings, or
  - You set `profiles.premium = true` for their user id (SQL / future webhook)

Account Premium is stored on `profiles.premium` so it works on every device after sign-in.

## Security (what we enforce)

- Supabase **Auth** for password hashing & sessions (not plain local passwords)
- **Row Level Security**: users only read/write their own goals, tasks, journal, profile
- No silent “guest” user when cloud auth is configured
- Dashboard requires a signed-in user
- Privacy blurb on signup; contact BambooTide for privacy requests

## Test checklist

1. Sign up with a real email → land on dashboard  
2. Sign out → sign in on another browser → same goals (after cloud save path)  
3. Free: max 3 active goals  
4. Activate Premium / set `profiles.premium` → unlimited  
5. Settings shows **Buy Premium — $7.99**
