# Turn off “Demo workspace” — real logins

If the sidebar says **Demo workspace** or any email/password works, the site is still in **demo mode** (local fake accounts). That is **not** production.

## Why it happens

Demo turns on when:

1. `NEXT_PUBLIC_DEMO_MODE=true`, **or**
2. Supabase is **not** set (`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` missing)

Netlify already sets `NEXT_PUBLIC_DEMO_MODE=false`. You still need **Supabase**.

---

## Steps (about 15 minutes)

### 1. Create a free Supabase project

1. Go to [https://supabase.com](https://supabase.com) → New project  
2. Set a database password (save it)  
3. Wait until the project is ready  

### 2. Create tables + security

1. Supabase → **SQL Editor** → New query  
2. Paste **all** of `supabase/schema.sql` from the Goal Garden repo  
3. Run it  

### 3. Enable email login

1. **Authentication → Providers → Email** → enabled  
2. For launch testing you can turn **off** “Confirm email”  
   (turn confirm **on** later for better security)

### 4. Copy keys

**Project Settings → API:**

| Copy this | Into Netlify as |
|-----------|-----------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### 5. Netlify environment

Site **goal-garden** → Environment variables (Production):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://goal-garden.netlify.app` |

### 6. Redeploy

Deploys → **Trigger deploy** (or push to GitHub).

### 7. Test

1. Open https://goal-garden.netlify.app/signup  
2. Use a **real** email + password (8+ chars)  
3. Sidebar should say **Member · signed in** (not Demo)  
4. Sign out → sign in again with the **same** password  
5. Wrong password → error (not a free pass)

---

## After this

- No more “any information works”  
- Accounts live in Supabase Auth  
- Goals can sync per user (cloud path)  
- Premium can attach to the account  

Desktop Electron can still use local demo-style storage offline.
