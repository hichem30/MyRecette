# Test Plan — PR #1 latest commits (71554a7, 07dd782)

Target: https://shop.redbarnmarket.workers.dev (Cloudflare prod, KV-cached)
Devin session: https://app.devin.ai/sessions/50e359d842d84ea586e02300cadfc998

## What changed (user-visible)
1. **/deals restructured into 3 visually-distinct sections** — Discounted Products (rose/Sale pill), Bundle Deals (amber pill + amber-tinted bg, clickable cards), Active Promo Codes (emerald dashed coupons).
2. **Bundle detail page `/bundles/[id]`** — clicking a bundle card lands on a product-style detail page with full item list, savings chip, ChevronRight links per item.
3. **Admin promo edit** — `/admin/promos` now has an Edit button per row; reuses the create form pre-populated; submits via UPDATE.
4. **Promo scoping enforced at checkout** — when a promo has `applies_to_product_ids`/`applies_to_category_slugs`, the discount is computed against only those scoped cart items and emitted as a Stripe `amount_off` coupon (never `percent_off`), so out-of-scope items don't get discounted.

## Existing test data (already in DB)
- **Bundle "new marvel"** — 7 products, $89 bundle price, active until 2026-05-30. ID `d11c7111-25ad-435e-bc95-a187b7b03bfa`
- **Promo BLUE** — 90% off, scoped to two specific products:
  - Vinyl Plank Flooring — Rustic Oak 20 sq ft (slug `vinyl-plank-flooring-rustic-oak-20sq`, $54.99)
  - Treated Pine Deck Board 5/4×6 — 16 ft (slug `treated-pine-deck-board-5-4x6-16ft`, $14.99)
  - Scoped subtotal of both = $69.98 → expected discount = 90% × $69.98 = **$62.98**

---

## Test 1 — /deals has three visually distinct sections (sections render in correct order with correct color themes)

**Why this would fail if broken:** The PR moved discounted products to the top (was at bottom), recolored promo cards from amber-dashed to emerald-dashed, and added a tinted amber background behind bundles. If the section ordering or color theming regressed, the visual hierarchy would be wrong.

Code references:
- `src/app/[locale]/deals/page.tsx:111-322` — three sections in order Discount → Bundle → Promo
- `src/app/[locale]/deals/page.tsx:115` — `bg-rose-100 ... text-rose-700` pill for Discount
- `src/app/[locale]/deals/page.tsx:141` — `bg-amber-50/30` section background, `bg-amber-100 ... text-amber-800` pill for Bundle
- `src/app/[locale]/deals/page.tsx:252` — `bg-emerald-100 ... text-emerald-800` pill for Promo
- `src/app/[locale]/deals/page.tsx:290-296` — `border-emerald-300 bg-emerald-50/50` dashed coupons (previously amber)

**Steps:**
1. Navigate to https://shop.redbarnmarket.workers.dev/deals
2. Observe the section order top-to-bottom

**Assertions:**
- First section: pill text reads exactly **"Sale"** in rose color, heading is **"Discounted Products"**.
- Second section (between Sale and Codes): pill text reads exactly **"Bundles"** in amber, heading is the configured bundles title, section has a faintly amber-tinted background.
- Third section: pill text reads exactly **"Codes"** in emerald, heading is **"Active Promo Codes"**, the promo cards use **emerald dashed borders** (NOT amber dashed — that was the pre-PR look).

---

## Test 2 — Bundle card clickable → `/bundles/[id]` detail page renders 7 items

**Why this would fail if broken:** Bundle cards were previously inline articles with `<Link>` only on individual product names. The PR wraps the entire card in a single `<Link href={/bundles/${b.id}}>`. A broken implementation would either keep cards non-clickable or land on a 404. The detail page is a brand new route that didn't exist before.

Code references:
- `src/app/[locale]/deals/page.tsx:166-167` — `<Link key={b.id} href={`/bundles/${b.id}`}`
- `src/app/[locale]/bundles/[id]/page.tsx:43-198` — full new detail page

**Steps:**
1. From https://shop.redbarnmarket.workers.dev/deals click the "new marvel" bundle card (anywhere on the card)
2. Land on `/bundles/d11c7111-25ad-435e-bc95-a187b7b03bfa`

**Assertions:**
- URL after click contains `/bundles/d11c7111-25ad-435e-bc95-a187b7b03bfa`
- Page shows the title **"new marvel"**, the bundle price **$89.00**, and a line-through original total (sum of 7 prices > $89)
- Page shows a **"You save $X"** chip in green
- Section heading **"What's in this bundle"** is followed by a list of exactly **7 items** (rows containing thumbnail + name + category + price + chevron)
- Each item row links to `/products/<slug>` — click one and the product detail page loads

---

## Test 3 — Admin promo edit (BLUE) saves changes

**Why this would fail if broken:** Admin promos page previously only had Delete + active toggle. The PR adds Edit button + edit mode. A broken implementation would either: (a) no Edit button visible, (b) form doesn't pre-populate, (c) clicking save calls INSERT and creates a duplicate row instead of UPDATE on the existing one.

Code references:
- `src/app/admin/promos/page.tsx:71-78` — `openEdit` populates form
- `src/app/admin/promos/page.tsx:124-131` — UPDATE branch on save
- `src/app/admin/promos/page.tsx:386-391` — Edit button per row

**Steps:**
1. Log in at `/login` as `redbarnmarket@protonmail.com` with `${RED_BARN_ADMIN_PASSWORD}`
2. Navigate to `/admin/promos`
3. Find row "BLUE" — click its **Edit** button (next to Delete)
4. Verify the form opens **above the table** populated with: code=BLUE, type=percent, value=90, with 2 checked products under "Limit to specific products"
5. Change the **description** to `Scope test EDITED` and click **Save changes**
6. Confirm the BLUE row's row count in the table is still **1** (no duplicate inserted)
7. Click **Edit** on BLUE again and confirm the description field now reads `Scope test EDITED`

**Assertions:**
- Edit button visible in the rightmost column of the BLUE row.
- After clicking Edit: form heading area shows **"Editing existing code"** banner.
- The "Limit to specific products" checkbox group shows **2 of N products checked**.
- After saving: total BLUE rows in the table = 1 (no duplicate).
- Re-opening Edit shows description = `Scope test EDITED`.

---

## Test 4 — Promo scoping at checkout — discount = 90% × scoped subtotal, NOT 90% × full cart (PRIMARY)

**Why this would fail if broken:** This is the architectural fix. Before the PR, the checkout endpoint created a `percent_off` Stripe coupon that Stripe then applied to the entire cart. After the PR, the endpoint reads the promo's scope arrays, sums only scoped items, and emits an `amount_off` coupon. A broken implementation would yield a discount equal to 90% of the **entire cart** instead of 90% of the **scoped subtotal**.

Code references:
- `src/app/api/create-checkout-session/route.ts:211-227` — reads scope arrays
- `src/app/api/create-checkout-session/route.ts:229-240` — computes `scopedCents` against only matching cart items
- `src/app/api/create-checkout-session/route.ts:242-249` — converts percent to clamped `amount_off`
- `src/app/api/create-checkout-session/route.ts:265-270` — Stripe coupon `amount_off` not `percent_off`

**Cart setup:**
- Add Vinyl Plank Flooring ($54.99 — scoped)
- Add Treated Pine Deck Board ($14.99 — scoped)
- Add **any third product** at known price, e.g. one of the non-scoped products; goal is a non-zero unscoped subtotal so the full-cart-vs-scoped distinction is visible.

Expected math:
- Scoped subtotal = $54.99 + $14.99 = **$69.98**
- Correct discount = 90% × $69.98 = **$62.98**
- Buggy (pre-PR) discount would have been 90% × ($69.98 + third-product price) which is strictly larger

**Steps:**
1. Sign up as a fresh customer via `/signup` (or log in existing customer)
2. Add the 2 scoped products + 1 unscoped product to cart
3. Open cart drawer; verify subtotal is correct (sum of 3 items)
4. Click "Checkout"; enter address (US state in allowed zone) and apply promo code **BLUE**
5. Click "Proceed to payment"; observe the Stripe-hosted checkout page

**Assertions on Stripe checkout page:**
- "Promotion" line (or equivalent discount line) reads exactly **`-$62.98 USD`** (90% × $69.98).
- Subtotal on Stripe page = sum of all 3 line items at full price (Stripe shows pre-discount subtotal).
- Final total = full subtotal − $62.98.
- The discount does NOT equal 90% of the full 3-item subtotal — that would be a regression.

**If `-$62.98` is not what's shown** (e.g. it's some other percentage of the full cart): the scoping fix is broken. Capture the Stripe page screenshot.

---

## Out of scope (deferred)
- Translation strings (Spanish already removed per earlier session)
- Bundle auto-pricing at checkout (still per-item full price; user accepted this in last message)
- Mobile-specific layout (covered by earlier mobile-header work, not in this PR)
- Visual polish on rose/amber/emerald themes — only checking color theme is present, not exact pixel values
