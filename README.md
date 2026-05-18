# Red Barn Western Market

Bilingual (English / Spanish) e‑commerce storefront and admin dashboard for **Red Barn Western Market** — a family‑owned local trading post in Sand Springs, OK selling lumber, hardware, plumbing, mattresses, clothing, groceries, and more since 1999. Visit at **308 S. 209th W. Ave., Sand Springs, OK 74066**.

- **Phone:** +1 (918) 245‑8112
- **Email:** redbarnwesternmarket@gmail.com
- **Hours:** Mon–Sat · 9am–6pm · Closed On Sunday
- **Facebook:** https://www.facebook.com/redbarnwesternmarket/

The site is a fully static Next.js 14 / Tailwind project backed by Supabase and Stripe. It will run end‑to‑end with mock data out of the box — every external service is optional until you provide keys.

---

## Tech Stack

| Layer        | Choice |
|--------------|--------|
| Framework    | Next.js 14 (App Router) + TypeScript |
| Styling      | Tailwind CSS |
| i18n         | `next-intl` (EN default, ES) |
| Data         | Supabase (Postgres + Auth + Storage) |
| Payments     | Stripe Checkout (test mode out of the box) |
| Auth         | Supabase Auth (email/password + Google / Facebook OAuth) |
| Hosting      | Netlify or Cloudflare Pages (static + serverless functions) |
| Icons        | lucide-react |
| PWA          | `public/manifest.json` + `public/sw.js` |

No always‑on server. No third‑party cart platforms. Stripe takes payments directly.

---

## Quick start

```bash
cp .env.example .env.local
# (optional: paste Supabase + Stripe keys — leave blank to run on mock data)
npm install
npm run dev
```

Visit http://localhost:3000.

The English site lives at `/`, Spanish at `/es`. Admin dashboard is at `/admin` (gated by Supabase Auth — see below).

### Available scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # TypeScript (no emit)
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in whichever services you want to enable. Everything is optional — the storefront will display mock products if Supabase is not configured, and the **Checkout** button will display a friendly error if Stripe is not configured.

| Variable                             | Required for | Notes |
|--------------------------------------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL`           | DB + admin auth | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | DB + admin auth | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY`          | Admin writes + Stripe webhook | **Server‑only**. Never expose to the browser. |
| `STRIPE_SECRET_KEY`                  | Stripe Checkout | Test mode: `sk_test_…`, Live mode: `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook | Generated when you create the webhook endpoint |
| `NEXT_PUBLIC_SITE_URL`               | Stripe success/cancel URLs | e.g. `https://redbarnwesternmarket.com` |

---

## Supabase setup

1. Create a free project at https://supabase.com.
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Copy the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (server only — used by webhooks and admin pages).
4. Open the **SQL Editor** and run the two migrations in order:
   - `supabase/migrations/0001_init.sql` — creates tables, RLS policies, helper functions, signup trigger.
   - `supabase/migrations/0002_seed.sql` — *optional* seed for the 8 starter categories.
5. Create your admin account: visit `/admin/login`, sign up via OAuth or email, then promote yourself to admin by running:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

That's it — `/admin` is now unlocked for that account.

### OAuth providers (Google / Facebook)

Each OAuth button is wired in `LoginCard.tsx`. To make a provider live, enable it in **Supabase → Authentication → Providers** and paste in client IDs / secrets from the provider's developer console:

- **Google:** https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID (Web). Add Supabase callback URL `https://<your-project>.supabase.co/auth/v1/callback` to *Authorized redirect URIs*. **Free.**
- **Facebook:** https://developers.facebook.com → My Apps → Create App → Facebook Login. Use the same Supabase callback URL. **Free.**

For non‑technical, step‑by‑step instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

Buttons remain in the UI but show a polite error until the provider is enabled.

---

## Stripe setup

### Test mode (free, no business verification needed)

1. Create an account at https://dashboard.stripe.com.
2. In the top‑right toggle, switch to **Test mode**.
3. Copy your **secret key** (`sk_test_…`) into `STRIPE_SECRET_KEY`.
4. Run `npm run dev`. Add a product to the cart → click *Checkout* → the page redirects to Stripe Checkout. Use test card `4242 4242 4242 4242`, any future expiry, any 3‑digit CVC.
5. Stripe sends the customer back to `/checkout/success` and the cart auto‑clears.

### Webhook (so paid orders write to the `orders` table)

Two options:

**Option A — local development with the Stripe CLI:**
```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe-webhook
# Stripe prints a webhook signing secret — paste it into STRIPE_WEBHOOK_SECRET.
```

**Option B — production deployment:**
1. In **Stripe → Developers → Webhooks**, click *Add endpoint*.
2. URL: `https://<your-site>/api/stripe-webhook`.
3. Listen for `checkout.session.completed`.
4. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET` in your hosting environment variables.

Every paid checkout will now insert a row into `public.orders` automatically.

### Going live (receiving real money)

1. In the Stripe dashboard, click **Activate account**. Fill in business name, EIN/SSN, business address, and the bank account that should receive payouts. This is the **only** step required to get paid — Stripe handles the rest.
2. Stripe verifies you (usually instant for US sole proprietors).
3. Switch the dashboard to **Live mode** and copy the **live** `sk_live_…` and `pk_live_…` keys into your **production** environment (Netlify / Cloudflare). Keep test keys in development.
4. Add a live webhook endpoint following *Option B* above and update `STRIPE_WEBHOOK_SECRET`.
5. Payouts land in your linked bank account every **2 business days** (rolling) by default. You can switch to manual payouts in **Settings → Payouts**.

### Payment methods

Enable all the payment methods you want from **Stripe → Settings → Payment methods**: Cards, Apple Pay, Google Pay, Link, ACH, Klarna, etc. The checkout session is created with `payment_method_types` left unset, so Stripe auto‑selects the methods you've enabled.

---

## Hosting (Netlify or Cloudflare Pages)

The project deploys cleanly to either platform. Both have a generous free tier.

### Netlify
1. Push the repo to GitHub.
2. Netlify → **Add new site → Import from Git** → pick the repo.
3. Build command: `npm run build`  ·  Publish directory: `.next`  ·  Functions: auto‑detected.
4. Add all env vars from `.env.example` under **Site settings → Environment variables**.
5. Add a custom domain → Netlify auto‑provisions HTTPS.

### Cloudflare Pages
1. Push to GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create application → Pages → Connect to Git**.
3. Build command: `npm run build`  ·  Build output: `.next`.
4. Add the same env vars under **Settings → Environment variables**.
5. Cloudflare automatically serves over its global CDN.

> Both providers will run a fresh build any time you push to `main` — there is no maintenance step.

---

## Project structure

```
src/
├── app/
│   ├── [locale]/                # localised storefront (en/es)
│   │   ├── page.tsx             # homepage
│   │   ├── products/…           # listing + detail + JSON-LD
│   │   ├── categories/…
│   │   ├── deals/page.tsx
│   │   ├── contact/page.tsx     # contact + bulk-order form
│   │   ├── about/page.tsx
│   │   ├── login/page.tsx
│   │   ├── wishlist/page.tsx
│   │   └── checkout/{success,cancel}/page.tsx
│   ├── admin/                   # protected dashboard (Supabase Auth gate)
│   │   ├── page.tsx
│   │   ├── products/…
│   │   ├── categories/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── quotes/page.tsx
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── create-checkout-session/route.ts
│   │   ├── stripe-webhook/route.ts
│   │   ├── contact/route.ts
│   │   └── bulk-quote/route.ts
│   └── auth/callback/route.ts   # OAuth code exchange
├── components/                  # Header, Footer, ProductCard, BulkQuoteForm, …
├── lib/
│   ├── cart/CartProvider.tsx    # cart + wishlist context (localStorage)
│   ├── data/                    # data layer + mock fallback
│   ├── i18n/                    # next-intl config
│   ├── stripe/server.ts
│   └── supabase/{server,client}.ts
└── middleware.ts                # locale routing

messages/
├── en.json
└── es.json

supabase/migrations/             # SQL: schema + seed
public/                          # PWA manifest, service worker, icons
```

---

## What's wired & what's not

| Feature | Status |
|---------|--------|
| Bilingual storefront (EN/ES) with language selector | ✓ |
| 8 product categories matching the real store | ✓ |
| Products listing (10/page pagination, filters, search) | ✓ |
| Product detail page with JSON‑LD structured data | ✓ |
| Hot Deals page | ✓ |
| Categories grid + detail page | ✓ |
| Cart drawer + checkout button (localStorage) | ✓ |
| Wishlist page (localStorage) | ✓ |
| Contact form → `messages` table | ✓ |
| Bulk‑Order / Contractor Quote form → `bulk_quotes` table | ✓ |
| Visit Us section with embedded Google map | ✓ |
| Admin auth gate (only `role='admin'`) | ✓ |
| Admin: Products / Categories / Messages / Orders / Quotes CRUD | ✓ |
| Stripe Checkout API route | ✓ — needs `STRIPE_SECRET_KEY` |
| Stripe webhook → orders table | ✓ — needs `STRIPE_WEBHOOK_SECRET` |
| Mock data fallback when Supabase unconfigured | ✓ |
| PWA (manifest + service worker + offline page) | ✓ |
| OAuth (Google / Facebook) buttons | ✓ — enable in Supabase to activate |
| About + Login pages designed | ✓ |

The **only manual steps** to take the site live are:
1. Run the two SQL migrations in Supabase.
2. Paste keys into Netlify/Cloudflare env vars.
3. Activate your Stripe account so payouts can land in your bank.

---

## License

© Red Barn Western Market · Sand Springs, OK. All rights reserved.
