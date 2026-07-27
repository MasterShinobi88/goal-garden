# Stripe subscription for Goal Garden ($7.99/mo)

**Never put secret keys in code or Git.**  
Dashboard keys: https://dashboard.stripe.com/apikeys  
Best practices: https://docs.stripe.com/keys-best-practices

Your snippets create a product at **$10.00** (`unit_amount: 1000`).  
Goal Garden Premium is **$7.99/mo** → `unit_amount: **799**`.

---

## What we built in the app

| Route | Purpose |
|--------|---------|
| `POST /api/stripe/checkout` | Creates Checkout Session (`mode: subscription`) |
| `GET /api/stripe/confirm` | After success, verifies session + sets Premium |
| `POST /api/stripe/webhook` | Keeps Premium in sync (optional but recommended) |

Secret key is read only on the server as `STRIPE_SECRET_KEY`.

---

## Netlify environment variables

| Variable | Where | Example |
|----------|--------|---------|
| `STRIPE_SECRET_KEY` | Server only | `sk_test_…` then `sk_live_…` |
| `STRIPE_PRICE_ID` | Optional | `price_…` from Dashboard (monthly $7.99) |
| `STRIPE_WEBHOOK_SECRET` | Optional | `whsec_…` after webhook endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | unlocks Premium on profile from webhook |
| `NEXT_PUBLIC_SITE_URL` | Public | `https://goal-garden.netlify.app` |
| `NEXT_PUBLIC_PREMIUM_CHECKOUT_URL` | Optional fallback | Payment Link if API fails |

**Do not** set `NEXT_PUBLIC_STRIPE_SECRET_KEY` (never expose `sk_` to the browser).

---

## Option A — Dashboard only (no Node script)

1. Stripe → **Product catalog** → **Add product**  
   - Name: `Goal Garden Premium`  
   - Description: include BambooTide + 10% cleanup  
   - **Recurring** → **Monthly** → **$7.99**  
2. Copy **Price ID** (`price_…`) → Netlify `STRIPE_PRICE_ID`  
3. Copy **Secret key** → Netlify `STRIPE_SECRET_KEY`  
4. Redeploy  
5. App: Settings → Premium → **Subscribe**

If `STRIPE_PRICE_ID` is missing, Checkout still works using **inline price_data** at $7.99/mo (no product create each time in code beyond Checkout).

---

## Option B — One-time script (local only)

Create product once from your machine (key in **env**, not the file):

```bash
# PowerShell
$env:STRIPE_SECRET_KEY="sk_test_..."
node scripts/create-stripe-premium-product.mjs
```

Then put the printed `price_…` into Netlify.

---

## Checkout Session (what the app does)

Same idea as Stripe’s example, but:

- `mode: 'subscription'`
- `$7.99` = `799` cents  
- success → `/dashboard/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`  
- cancel → `/dashboard/settings?checkout=cancel`  
- metadata includes `supabase_user_id` when signed in  

We **do not** use `managed_payments` blueprints or hardcode keys.

---

## Webhooks (recommended)

1. Stripe → **Developers → Webhooks → Add endpoint**  
2. URL: `https://goal-garden.netlify.app/api/stripe/webhook`  
3. Events:  
   - `checkout.session.completed`  
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`  
5. Also set `SUPABASE_SERVICE_ROLE_KEY` so Premium can be written to `profiles`

---

## Test

1. Test mode secret key  
2. Subscribe with card `4242 4242 4242 4242`  
3. Land on Settings with Premium unlocked  
4. Switch to **live** keys when ready  

---

## Corrected product amounts

| Wrong (Stripe sample) | Goal Garden |
|----------------------|-------------|
| `unit_amount: 1000` ($10) | `unit_amount: 799` ($7.99) |
| name: Basic subscription | Goal Garden Premium |
