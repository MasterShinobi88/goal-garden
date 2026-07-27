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

### 3. Enable email login + **require verification**

1. **Authentication → Providers → Email** → enabled  
2. **Confirm email** → **ON** (required — Goal Garden blocks unverified users)  
3. **URL configuration** (Auth → URL Configuration):  
   - **Site URL:** `https://goal-garden.netlify.app`  
   - **Redirect URLs** add:  
     - `https://goal-garden.netlify.app/auth/callback`  
     - `http://localhost:3000/auth/callback` (local dev)

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
2. Use a **real** email + password (8+ chars) + display name  
3. App says **check your email** — you are **not** signed in yet  
4. Open the confirmation link → lands on `/auth/callback` → dashboard  
5. Sign out → sign in works only **after** verification  
6. Before verifying, sign-in shows **verify your email** + Resend button

---

## After this

- No more “any information works”  
- Accounts live in Supabase Auth  
- Goals can sync per user (cloud path)  
- Premium can attach to the account  

Desktop Electron can still use local demo-style storage offline.
