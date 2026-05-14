# Test Plan — Red Barn Western Market

## What changed (user-visible)
Brand-new bilingual (EN/ES) Next.js storefront + admin dashboard for **Red Barn Western Market**: homepage, products listing (10/page), product detail (with JSON-LD), categories, deals, contact + bulk-quote forms, about, login (Google/Facebook OAuth + email/password), wishlist, cart drawer, checkout success/cancel pages, and an `/admin` console with auth gate. Backed by Supabase + Stripe; gracefully degrades to mock data when keys aren't set.

## Environment
- **Local dev server** at http://localhost:3000 (Next.js dev mode, mock-data fallback active — no Supabase / Stripe keys).
- Code path reads `isSupabaseConfigured()` / `isStripeConfigured()` and falls back to mock data + friendly error messages.

## What can't be tested without credentials (will be reported as `untested`)
1. **Real Supabase login/signup** — Supabase URL + anon key are not set, so `signInWithPassword` / `signUp` calls will not actually hit Supabase. UI error state will be tested.
2. **Real Stripe Checkout** — `STRIPE_SECRET_KEY` is not set, so `/api/create-checkout-session` returns an error. UI error state will be tested.
3. **OAuth (Google/Facebook)** — Each provider needs to be enabled in Supabase first. UI error state will be tested.
4. **Stripe webhook → orders table** — Requires both Stripe and Supabase configured.

These would all be re-tested in a follow-up session once the user provides keys.

---

## Primary flow (adversarial — single recording)

### Test 1: Homepage loads with mock products, hero, Visit Us
- Navigate to http://localhost:3000
- **Expected:**
  - Hero heading text `The Heart of Every Ranch` is visible
  - Search bar with placeholder `Search products...` visible in hero
  - At least one product card is rendered under **New Arrivals** with a price like `$XX.XX`
  - At least one product card is rendered under **Hot Deals** with a strike-through original price
  - "Visit Us in Sand Springs" section shows address `308 S. 209th W. Ave., Sand Springs, OK`, phone `+1 (918) 245‑8112`, and an embedded Google Maps `<iframe>` (not a placeholder image)
  - Footer contains the Facebook icon linking to `facebook.com/redbarnwesternmarket`
- **Why it's adversarial:** A broken data fetch would show empty grids or `noProducts` text instead of cards. A broken Visit Us would show no address.

### Test 2: Language toggle EN → ES flips URL and content
- Click the language selector (globe icon, top right) — should currently show `EN`
- **Expected:**
  - URL changes from `/` to `/es`
  - Hero heading switches to the Spanish translation `El Corazón de Cada Rancho`
  - Nav items: `Home`→`Inicio`, `Products`→`Productos`, `Deals`→`Ofertas`, etc.
  - Toggle now displays `ES`
- **Why it's adversarial:** A broken i18n setup would leave English text or the page would crash.

### Test 3: Add to cart from product card, open cart drawer, verify badge count
- From the homepage New Arrivals section, click **Add to Cart** on any product card.
- **Expected:**
  - Cart badge in header increments from `0` to `1`
- Click the **Cart** icon in the header.
- **Expected:**
  - Cart drawer slides in from the right
  - Drawer lists the product I just added (thumbnail, name, price, quantity controls)
  - Subtotal row shows a non-zero `$XX.XX` value
  - "Calculated at checkout" caption visible
  - **Checkout** button visible at bottom
- **Why it's adversarial:** A broken CartProvider would not persist the item to localStorage or update the badge.

### Test 4: Checkout button degrades gracefully without Stripe keys
- Click **Checkout** in the cart drawer.
- **Expected:**
  - A browser alert appears containing the literal text "Stripe is not configured yet. Add your STRIPE_SECRET_KEY to .env.local." (per `CartDrawer.tsx:42`)
  - The page does NOT navigate to Stripe (still on local site)
- **Why it's adversarial:** A broken Stripe fallback would either silently fail or throw an uncaught error in console.

### Test 5: Wishlist toggle persists in localStorage
- Go to `/products` from header nav.
- Click the **heart icon** on one product card. Heart should fill / change color.
- Open `/wishlist` from the header.
- **Expected:**
  - The product I hearted is the ONLY product listed in the wishlist grid
  - If I hard-refresh the page, the product is still there (localStorage persistence)
- **Why it's adversarial:** A broken wishlist would either not save or show all products.

### Test 6: Products listing pagination + filter
- On `/products`, verify the pagination text reads `Showing 1-10 of 16 results` (16 mock products → page 1 shows 10).
- Click **Next** or page `2`.
- **Expected:**
  - URL contains `?page=2`
  - Header now reads `Showing 11-16 of 16 results`
  - Grid shows 6 products
- Click an "On Sale Only" filter toggle.
- **Expected:**
  - Result count drops to the number of mock products with `discount=true` (should be ≤ all)
- **Why it's adversalrial:** A broken pagination would show all 16 on page 1, or `Next` wouldn't navigate.

### Test 7: Product detail page renders + JSON-LD present
- From `/products`, click any product card to navigate to its detail page.
- **Expected:**
  - Breadcrumb: `Home > Products > <product name>`
  - Large product image visible
  - Product name, category, price displayed
  - Stock status visible (e.g., `In stock` or `Out of stock`)
  - Add-to-cart with quantity selector visible
  - View page source (Ctrl+U): a `<script type="application/ld+json">` block is present containing `"@type":"Product"` and the product name
- **Why it's adversarial:** A broken detail page would 404 or omit structured data.

### Test 8: Admin auth gate redirects unauthenticated users
- Navigate to `http://localhost:3000/admin`.
- **Expected:**
  - Page briefly shows `Loading...` text
  - Then redirects to `/admin/login` (URL bar changes)
  - Admin login card renders with Google / Facebook buttons
- **Why it's adversarial:** A broken auth gate would render the admin sidebar to anonymous visitors.

### Test 9: Admin login form shows friendly error when Supabase not configured
- On `/admin/login`, type any email + password into the email/password form and click **Sign In**.
- **Expected:**
  - Red error banner appears containing the literal text "Supabase is not configured yet. Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." (per `LoginCard.tsx:42`)
  - Page stays on `/admin/login` (no redirect)
- Click the **Continue with Google** button.
- **Expected:** Same error banner text.
- **Why it's adversarial:** A broken Supabase fallback would crash, show no message, or send a real network request.

### Test 10: Contact form submission shows correct UX when Supabase missing
- Navigate to `/contact`. Fill in name=`Test`, email=`test@test.com`, message=`Hi`. Click **Send Message**.
- **Expected:** Either a success message (server route swallows the insert when Supabase is missing) OR a clean error message — NO uncaught browser exception in DevTools console.
- **Why it's adversarial:** A broken form would throw a 500 visible in console / network tab.

### Test 11: Bulk Quote form is on the page and submittable
- Scroll down on `/contact` to the Bulk Order section.
- **Expected:**
  - Heading "Request a Quote" visible
  - Fields visible: company, contact person, email, phone, project type, estimated quantity, delivery (Yes/No), timeline, notes
  - Submit button labeled "Submit Quote Request"
- Fill the form and submit. **Expected:** clean UX (success or graceful error) — no uncaught exception.
- **Why it's adversarial:** This is a custom form added for the lumber-yard use case and not present in any AI scaffolding; missing it would mean the bulk-quote feature isn't wired.

---

## Out of scope (explicitly NOT testing)
- Real Stripe Checkout flow (no test key)
- Real Supabase login (no project)
- Real OAuth round-trips
- PWA install prompt (requires HTTPS production deployment)
- Mobile pixel-perfect comparison
- Lighthouse score

## Evidence
- Single screen recording covering all 11 tests above, annotated with `test_start` + `assertion` annotations.
- One GitHub comment on PR #1 with results table + recording link.
