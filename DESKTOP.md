# Goal Garden Desktop (Windows)

Standalone Windows app shell for Goal Garden, published under **BambooTide**.

## Quick start (dev)

```bash
cd goal-garden
npm install
npm run desktop
```

Opens Electron against `next dev` with `NEXT_PUBLIC_DESKTOP=true` (local/demo data).

## Production installer

```bash
npm run desktop:build
```

Output:

- `dist-desktop/Goal-Garden-Setup-0.1.0.exe`

## Premium keys (offline v1)

Enter in **Settings → Premium**:

| Key | Use |
|-----|-----|
| `GG-PREMIUM-LAUNCH` | Launch / press |
| `GG-PREMIUM-BAMBOO` | BambooTide internal |
| `GG-DEV-UNLOCK` | Development |

Free tier: **3 active goals**. Premium: unlimited + badge.

## Architecture

- **Electron** loads a local **Next.js standalone** server (`output: 'standalone'`)
- Data: **localStorage** (demo mode forced on desktop)
- AI: BYOK in Settings, or mock offline
- License: local keys now; Lemon Squeezy online keys later

## BambooTide download page (next)

Host the installer at:

`https://bambootide.org/apps/goal-garden/download`

Landing + Free vs Premium matrix on:

`https://bambootide.org/apps/goal-garden`

## Code signing

Unsigned builds trigger Windows SmartScreen. Add a code-signing cert when sales cover it; until then document “More info → Run anyway”.
