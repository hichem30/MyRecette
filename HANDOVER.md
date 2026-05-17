# Red Barn Western Market — Client Handover Guide

This is the runbook you (Sami) follow to hand the live storefront to your client while keeping the GitHub repo private. The client never touches code, GitHub, Cloudflare, or Supabase — they only get:

- the public storefront URL (eventually their own domain),
- an admin login at `/admin` with their own email,
- a Stripe dashboard that receives the money.

You keep ownership of the codebase, Cloudflare account, Supabase project, and remain the technical maintainer.

> Time estimate end-to-end: **~90 minutes** of your time + waiting on the client for keys/domain.

---

## Phase 0 — Before you start (~5 min, just you)

1. Make sure CI is green and the latest deploy at https://shop.redbarnmarket.workers.dev is the one you want to ship. The current `devin/1778689863-rb-build` branch is the production code.
2. Run a real-money smoke test in **Stripe test mode** while still on test keys:
   - Sign in with a test customer account
   - Place an order using card `4242 4242 4242 4242`, any future expiry, any CVC
   - Confirm the order appears in `/account/orders` and `/admin/orders`
   - Confirm an email receipt lands in the test customer inbox
3. Open `/admin/staff` and note your own admin row — you'll demote yourself later (Phase 7).

---

## Phase 1 — Client creates a Stripe account (~15 min, them)

Send the client these literal instructions:

> **Step 1 — Sign up for Stripe.** Go to https://dashboard.stripe.com/register and create an account with your business email. Pick "Standard" plan (free).
>
> **Step 2 — Activate payments.** In the dashboard, click the orange **"Activate payments"** button (top right). Fill out the business profile, tax info, and bank account where you want the money deposited. Stripe usually approves in under an hour.
>
> **Step 3 — Customize emails.** Settings → Branding → upload the Red Barn logo and pick brand colors. Settings → Emails → make sure **"Successful payments"** is enabled (this is the receipt your customers get).
>
> **Step 4 — Send me API keys.** Once activated, go to Developers → API keys. You'll see two keys:
> - **Publishable key** (`pk_live_…`) — safe to share
> - **Secret key** (`sk_live_…`) — click "Reveal live key", then copy it
>
> Send both keys to me **in a secure channel** (not regular email — use a password manager share link, Signal, or 1Password share).

Once they send you the keys, **save both** somewhere safe (you'll need them for Phase 4).

---

## Phase 2 — Client buys a domain (~15 min, them)

Send them this:

> **Option A (recommended) — Cloudflare Registrar.** Cheapest, no markup, free WHOIS privacy.
> 1. Sign up at https://dash.cloudflare.com/sign-up
> 2. Go to https://dash.cloudflare.com → Domain Registration → Register Domains
> 3. Search for the domain (e.g. `redbarnmarket.com`), buy it
> 4. Once purchased, on the same screen click "Share account access" and add my email (`samijouili1996@gmail.com`) as **Super Admin**. This lets me wire the domain to the live site for you.
>
> **Option B — GoDaddy / Namecheap / etc.** Buy the domain on any registrar. After purchase, send me the domain name + temporary access to log in once (so I can move DNS to Cloudflare). After that, you can change the password back.

Wait for the client to do this and grant you access.

---

## Phase 3 — Wire the domain to the Cloudflare Worker (~10 min, you)

Once the client has bought the domain and given you access to their Cloudflare account (Option A) OR you've moved DNS to your own Cloudflare account (Option B):

### Option A (client's Cloudflare account)
1. Switch to the client's Cloudflare account in the dashboard switcher (top left).
2. Go to **Workers & Pages → shop** (or whatever you named the worker).
3. Click **Settings → Domains & Routes → Add → Custom domain**.
4. Type the new domain (e.g. `shop.redbarnmarket.com` or `redbarnmarket.com`) and click Add.
5. Cloudflare auto-creates the DNS record and provisions SSL in ~1 min.

### Option B (your Cloudflare account)
1. In **your** Cloudflare dashboard → Add a Site → type the domain → pick Free plan.
2. Cloudflare shows two nameservers (`xxx.ns.cloudflare.com`). Log into the client's registrar (GoDaddy etc.) and change the nameservers to those two. Save.
3. Wait 5–30 min for DNS propagation. Cloudflare emails you when active.
4. Then follow Option A steps 2–5 above.

After this step, the domain should serve the same site as `shop.redbarnmarket.workers.dev`. Test it in an incognito window.

---

## Phase 4 — Update Cloudflare Worker environment variables (~5 min, you)

In Cloudflare dashboard → Workers & Pages → shop → **Settings → Variables and Secrets**:

| Variable | Value | Type |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://redbarnmarket.com` (the new domain, **no trailing slash**) | Variable |
| `STRIPE_SECRET_KEY` | `sk_live_…` (from Phase 1) | **Secret** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` (from Phase 1) | Variable |
| `STRIPE_WEBHOOK_SECRET` | will fill in Phase 5 | **Secret** |

Hit **Save and deploy**. Cloudflare auto-deploys in ~30 sec.

> ⚠️ Use the **Secret** type (not Variable) for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — secrets are encrypted at rest and never shown back in the UI.

---

## Phase 5 — Set up Stripe webhook on the new domain (~10 min, you)

The webhook tells your site when a customer successfully paid, so the order can be saved.

1. Log into https://dashboard.stripe.com with the **client's** Stripe account (use the keys they sent you — Settings → Team → Add member, or have them invite you as a Developer).
2. Go to Developers → Webhooks → **Add endpoint**.
3. Endpoint URL: `https://redbarnmarket.com/api/stripe-webhook` (or whatever the new domain is).
4. Events to send: select `checkout.session.completed`.
5. Click "Add endpoint", then click on it to open it, then click "Reveal" next to **Signing secret** and copy the `whsec_…` value.
6. Go back to Cloudflare → Worker → Settings → Variables → paste it into the `STRIPE_WEBHOOK_SECRET` secret (created empty in Phase 4). Save & deploy.

---

## Phase 6 — Update Supabase URL configuration (~5 min, you)

So the email confirmation / password reset links point at the new domain.

1. Open https://supabase.com/dashboard/project/fjngynjzktxclcvpsbtk/auth/url-configuration
2. **Site URL**: change to `https://redbarnmarket.com`
3. **Redirect URLs**: add `https://redbarnmarket.com/**` to the allow-list. **Keep** the old `https://shop.redbarnmarket.workers.dev/**` entry too so any in-flight signup emails still work for a week.
4. Save.

That's the only Supabase change required. The data itself doesn't move.

---

## Phase 7 — Hand over admin access (~10 min, both)

Now make the client an admin **on the live database** and remove your own admin role.

1. While **still signed in as you** (`redbarnmarket@protonmail.com`), open `/admin/staff`.
2. Click **Invite Staff**.
3. Email: the client's email. Role: **Owner** (so they can manage everything including other staff). Send.
4. The client receives a sign-in link. They click it, set a password, and now have full admin access.
5. **Have the client verify** they can:
   - Log in at `https://redbarnmarket.com/login`
   - Land on `/admin`
   - Open `/admin/products` and edit something
   - Open `/admin/orders` and see existing orders
6. Once the client confirms everything works on their side, go back to `/admin/staff` and **demote yourself from Owner → Admin (or remove entirely)**. The client is now in full control of the storefront UI.

> Important: **keep your `redbarnmarket@protonmail.com` account active** as a fallback. If the client locks themselves out, you can still get back in via Supabase service-role key.

---

## Phase 8 — Remove the client from the GitHub repo (~2 min, you)

This is the one the user asked about specifically.

1. Open https://github.com/HichemJouili1996/Red-Barn/settings/access
2. Find the client's GitHub username (probably under "Manage access" → "Direct access")
3. Click the **⋯** menu next to their name → **Remove access** → confirm.
4. The repo is now private to you (and your main email account) only.

If you want to keep an extra layer of protection, also rotate any secrets that the client may have seen while they were a collaborator:
- Stripe secret key — Stripe dashboard → Developers → API keys → "Roll" the secret key, paste new value into Cloudflare.
- Supabase service role key — Supabase dashboard → Settings → API → "Roll service_role secret", paste new value into Cloudflare.

---

## Phase 9 — Final smoke test (~10 min, you)

End-to-end test on the **live** domain with **live** keys (real card or use Stripe's live test card `4242…` in their "test data" if still allowed):

1. Open `https://redbarnmarket.com` in incognito
2. Sign in as a regular customer (use a personal email, NOT the admin one)
3. Add an item to cart, apply a promo code if you have one active
4. Check out — Stripe should accept the new live keys
5. Confirm:
   - `/checkout/success` shows "Order saved to your account"
   - Email receipt arrives at the customer email
   - `/account/orders` shows the order
   - `/admin/orders` (sign in as the client) shows the order with the right total
6. Test the admin email campaign:
   - `/admin/campaigns` → pick a product, a bundle, and a promo code
   - Click "Compose email" → your default mail app should open with the full body
   - Send to yourself, verify the links work

---

## After handover — your ongoing role

You still own:
- The GitHub repo
- The Cloudflare account (Option B) or are a delegated admin on the client's (Option A)
- The Supabase project (`fjngynjzktxclcvpsbtk`)

The client owns:
- The Stripe account (and all the money)
- Their domain
- The admin login

**For future code changes:** the client opens an issue or messages you. You push a commit to `main`. Cloudflare auto-deploys in ~2 min. No client involvement needed.

**For database schema changes:** you run the migration in Supabase → SQL editor as you've been doing.

**For Stripe questions:** the client owns the dashboard. They can refund orders, change tax settings, update bank account, view payouts. They don't need you for any of that.

---

## Quick reference — what's where

| Thing | Lives in | Who owns it |
|---|---|---|
| Source code | GitHub repo `HichemJouili1996/Red-Barn` | You |
| Worker (running site) | Cloudflare → Workers & Pages → `shop` | You (or delegated) |
| Database | Supabase project `fjngynjzktxclcvpsbtk` | You |
| Storefront images | Supabase Storage `product_images` bucket | You |
| Domain | Registrar (Cloudflare/GoDaddy/etc.) | Client |
| Stripe (payments + receipts) | Stripe dashboard | Client |
| Admin staff list | `/admin/staff` UI | Client |
| Marketing email subscribers | `/admin/campaigns` (data in `public.profiles` `marketing_opt_in=true`) | Client |

---

## Troubleshooting cheat sheet

| Symptom | Fix |
|---|---|
| "1101 Worker threw exception" on the new domain | Cloudflare Worker isn't bound to the new domain. Phase 3 step 4. |
| Checkout works but no receipt email | Stripe → Settings → Emails → enable "Successful payments". Plus this commit forces `receipt_email` so it should be automatic. |
| Customer email confirmation links point at workers.dev instead of new domain | Phase 6 — update Supabase Site URL. |
| Stripe webhook returning 400 | `STRIPE_WEBHOOK_SECRET` doesn't match. Phase 5 step 5–6. |
| Order paid but doesn't appear in `/admin/orders` | Webhook didn't fire. Open the order's success page; you'll see an amber error box with a reason code (e.g. `STRIPE_WEBHOOK_SECRET_MISSING`). |
| Admin can't promote a new staff member | They need to be signed in as Owner, not Admin. Owner = full power, Admin = day-to-day. |

---

## Done.

After Phase 9, the client has a fully-functional self-service e-commerce site under their own brand and domain, you've handed over operational control without giving up the source code, and ongoing maintenance is a low-touch arrangement.
