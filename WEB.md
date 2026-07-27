# Goal Garden — browser app (GitHub → Netlify)

The **desktop installer** and the **browser app** share one codebase.  
Browser deploys are a normal Next.js site (demo mode, localStorage).  
Desktop builds still use Electron + `NEXT_OUTPUT=standalone`.

## How publishing works

```
You push to GitHub
       ↓
Netlify builds `npm run build`
       ↓
Live at garden.bambootide.org (or *.netlify.app)
       ↓
BambooTide marketing site links to that URL
```

BambooTide (`MasterShinobi88/BambooTide`) stays a **static** Netlify site.  
Goal Garden is a **second** Netlify site (this repo) so API routes (`/api/generate-plan`, etc.) work.

## One-time setup

### 1. Put Goal Garden on GitHub

From this folder:

```bash
cd goal-garden
git remote add origin https://github.com/MasterShinobi88/goal-garden.git
# create the empty repo on GitHub first if needed
git add -A
git commit -m "Goal Garden web + desktop"
git push -u origin master
```

### 2. Connect Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → Import from GitHub  
2. Select **goal-garden**  
3. Build settings are already in `netlify.toml`  
4. Deploy  

You’ll get a temporary URL like `https://random-name.netlify.app`.

### 3. Custom domain (recommended)

1. Netlify site → Domain management → **Add domain** `garden.bambootide.org`  
2. At your DNS (wherever bambootide.org is managed), add:

   | Type  | Name   | Value                         |
   |-------|--------|-------------------------------|
   | CNAME | garden | `<your-site>.netlify.app`     |

   Or use Netlify DNS and follow their wizard.

3. Wait for HTTPS (automatic).

### 4. Point BambooTide marketing at the app

On the BambooTide site, browser CTAs use:

`https://garden.bambootide.org`

Landing page: `https://bambootide.org/apps/goal-garden`  
(redirects/alias `/garden` → landing)

If the app is still on `*.netlify.app` only, temporarily change links in:

- `apps/goal-garden/index.html`
- `Index.html` (homepage section)
- `js/apps-config.js` (single place for URLs)

## Env vars (Netlify UI → Site configuration → Environment)

| Variable | Value | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Already in `netlify.toml` — free localStorage mode |
| `NEXT_PUBLIC_SITE_URL` | `https://garden.bambootide.org` | Optional |
| Supabase keys | optional | Leave empty for pure demo; add later for cloud accounts |
| AI keys | optional | Users can BYOK in Settings; mock planner works offline |

## Local browser

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Plant your first goal** (guest demo, no signup).

## Desktop still works

```bash
npm run desktop          # dev Electron
npm run desktop:build    # Windows installer (standalone output)
```

## Architecture reminder

| Surface | Host | Stack |
|---------|------|--------|
| Marketing + Tide & Crown | bambootide.org | Static HTML on Netlify |
| Goal Garden **browser** | garden.bambootide.org | Next.js on Netlify |
| Goal Garden **Windows** | Download `.exe` | Electron package from this repo |
