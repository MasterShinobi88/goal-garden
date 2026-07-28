# Goal Garden Premium — $7.99/month subscription

Yes — a **subscription** is better if you need ongoing support. One-time sales don’t fund continuous work.

**Full Stripe wiring (API + webhook):** see [STRIPE-SETUP.md](./STRIPE-SETUP.md).

## Product settings (Stripe or Lemon)

| Field | Value |
|--------|--------|
| Name | Goal Garden Premium |
| Price | **$7.99** |
| Type | **Recurring / subscription** |
| Interval | **Monthly** |
| Cancel | Customer can cancel anytime |
| Mission (description) | *10% of net proceeds support ocean & river cleanup. A BambooTide product.* |

---

## Stripe (subscription)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Product catalog** → **Add product**  
2. Name: `Goal Garden Premium`  
3. **Recurring** → **Monthly** → **$7.99**  
4. Save product  
5. **Payment links** → **New** → select this product  
6. Optional success URL: `https://garden.bambootide.org/dashboard/settings`  
7. Copy the link (`https://buy.stripe.com/...`)  

### Netlify env

```
NEXT_PUBLIC_PREMIUM_CHECKOUT_URL=https://buy.stripe.com/xxxxx
```

Redeploy.

### Test mode

- Toggle **Test mode** ON  
- Card: `4242 4242 4242 4242`  
- Then create a **live** link and update the env var  

---

## Lemon Squeezy (subscription)

1. [lemonsqueezy.com](https://lemonsqueezy.com) → Products → New  
2. Pricing: **Subscription** → **$7.99 / month**  
3. Publish → copy **Checkout / share** link  
4. Same Netlify env var as above  

Lemon is strong if you want them to act as merchant of record (tax/VAT on digital goods).

---

## After someone subscribes (until webhooks exist)

1. See their email in Stripe/Lemon  
2. In Supabase SQL:

```sql
update public.profiles
set premium = true,
    premium_source = 'stripe_subscription', -- or lemonsqueezy
    premium_activated_at = now()
where email = 'customer@email.com';
```

3. Later we can auto-sync via webhooks (subscription created / cancelled).

On cancel, set `premium = false`.

---

## Why subscription helps you

- Recurring revenue for hosting, support, features  
- Aligns with cleanup promise (ongoing mission, not a one-shot)  
- App already says: **Subscribe — $7.99/mo** + cleanup copy  

---

## Branding already in the app

- Sidebar: BambooTide logo + cleanup line  
- Login / signup: BambooTide mark  
- Marketing landing: BambooTide site  
- Premium card: mission + BambooTide footer  
