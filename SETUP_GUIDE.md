# Red Barn Western Market — Plain-English Setup Guide

This guide is written for **non-coders**. Follow each section in order — you only
need a web browser, an email account, and about **30 minutes total**. Nothing
here requires running any commands on a computer.

By the end you will have:

1. A **transactional email** address that the website uses to send "We got
   your message" replies, password resets, order confirmations, etc.
2. A working **Sign in with Google** button on the website.
3. A working **Sign in with Facebook** button on the website.
4. **Stripe** connected so customers can actually pay you and the money lands
   in your bank account.

> **Where do I paste the values I copy?**
> Every "Key", "ID", or "Secret" you copy below has to be pasted into the
> hosting dashboard (Netlify or Cloudflare Pages) as an **environment
> variable**. There is a short section at the very bottom of this guide called
> **["Where to paste your keys"](#where-to-paste-your-keys)** that walks
> through that, with screenshots.
>
> You can also just send each key to your developer / Devin and they will
> paste it in for you. **Never share these keys in public — treat them like
> passwords.**

---

## Table of contents
1. [Step 1 — Email (Gmail)](#step-1--email-gmail)
2. [Step 2 — Sign in with Google](#step-2--sign-in-with-google)
3. [Step 3 — Sign in with Facebook](#step-3--sign-in-with-facebook)
4. [Step 4 — Stripe (taking real payments)](#step-4--stripe-taking-real-payments)
5. [Where to paste your keys](#where-to-paste-your-keys)

---

## Step 1 — Email (Gmail)

**Goal:** Let the website (Supabase) send emails on behalf of `redbarnwesternmarket@gmail.com` — confirmations, password resets, "we got your message" replies.

There are two ways to do this. Pick **whichever feels easier**.

### Option A — Easiest: use Supabase's built-in email (no setup needed)

If you do nothing, Supabase will already send sign-up confirmation emails from
its own address (something like `noreply@mail.app.supabase.io`). The emails
work, they just don't say "Red Barn Western Market" in the From line.

**👉 If you're fine with this for now, skip to [Step 2](#step-2--sign-in-with-google).** You can come back and switch to Option B any time.

### Option B — Send emails from your own Gmail (recommended for a real store)

This lets emails come from **`redbarnwesternmarket@gmail.com`** which looks
much more professional.

1. **Open your Gmail account** at https://mail.google.com → sign in as
   `redbarnwesternmarket@gmail.com`.

2. **Turn on 2-Step Verification** (required by Google for app passwords):
    - Visit https://myaccount.google.com/security.
    - Find **"2-Step Verification"** → click **Turn on**.
    - Follow the prompts (Google will text or call your phone with a code).

3. **Create an App Password** (a special password just for the website to use):
    - Visit https://myaccount.google.com/apppasswords.
    - In **"App name"**, type `Red Barn Website`. Click **Create**.
    - Google shows you a **16-character password** (4 groups of 4 letters,
      like `abcd efgh ijkl mnop`). **Copy this immediately — Google will not
      show it again.**
    - You can also email it to yourself in a draft so you don't lose it.

4. **Tell Supabase to use Gmail to send mail:**
    - Sign in to https://supabase.com → open your project → left sidebar →
      **Project Settings** → **Authentication** → scroll to **"SMTP Settings"**.
    - Toggle **"Enable Custom SMTP"** → ON.
    - Fill in:

      | Field          | Value                                                                |
      |----------------|----------------------------------------------------------------------|
      | Sender email   | `redbarnwesternmarket@gmail.com`                                     |
      | Sender name    | `Red Barn Western Market`                                            |
      | Host           | `smtp.gmail.com`                                                     |
      | Port           | `465`                                                                |
      | Username       | `redbarnwesternmarket@gmail.com`                                     |
      | Password       | *(the 16-character app password you copied in step 3)*               |
      | Minimum interval | `60` (seconds)                                                     |

    - Click **Save**.
    - Click **Send test email** at the bottom — Supabase will email itself to
      verify it works. If you don't get the test email within 1 minute,
      double-check the password and try again.

5. **Done.** All website emails now come from `redbarnwesternmarket@gmail.com`.

> **Why 2FA?** Google won't let websites use your normal Gmail password
> anymore. An "App password" is a one-off password that only this website
> knows; if it ever leaks you can revoke just that one without changing your
> real password.

---

## Step 2 — Sign in with Google

**Goal:** The blue **"Continue with Google"** button on the login page
actually signs people in.

Time: **~10 minutes**. Free.

1. **Open Google Cloud Console** at https://console.cloud.google.com → sign
   in with `redbarnwesternmarket@gmail.com`.

2. **Create a new "Project"** (think of it as a folder for the website):
    - At the very top of the page, click the dropdown that says
      "Select a project" → **New project**.
    - Project name: `Red Barn Western Market`. Click **Create**.
    - Wait ~30 seconds, then click "Select project" so you're working *inside*
      that project (the top bar should now say "Red Barn Western Market").

3. **Set up the consent screen** (this is what users will see when they click
   "Continue with Google"):
    - Left sidebar → **APIs & Services** → **OAuth consent screen**.
    - Choose **External** → click **Create**.
    - **App name:** `Red Barn Western Market`
    - **User support email:** `redbarnwesternmarket@gmail.com`
    - **App logo:** (optional — upload the red barn logo if you have one)
    - **App domain → Application home page:** `https://redbarnwesternmarket.com`
      (or whatever your final website URL will be — you can change this
      later)
    - **Developer contact email:** `redbarnwesternmarket@gmail.com`
    - Click **Save and continue** through **Scopes** (just click *Save and
      continue* again — leave defaults).
    - On **Test users**, click **Add users** → add
      `redbarnwesternmarket@gmail.com` so you can test it. Click **Save and
      continue** → **Back to dashboard**.

4. **Create the OAuth Client ID** (the actual "key" the website uses):
    - Left sidebar → **APIs & Services** → **Credentials**.
    - Top → **+ Create Credentials** → **OAuth client ID**.
    - **Application type:** *Web application*
    - **Name:** `Red Barn Website`
    - **Authorized redirect URIs** → **+ Add URI**, paste this exactly:

      ```
      https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
      ```

      Replace `YOUR-PROJECT-ID` with the part of your Supabase URL before
      `.supabase.co`. To find yours: go to https://supabase.com → your project
      → **Project Settings** → **API** → look at "Project URL". For example
      if your URL is `https://abcdwxyz.supabase.co`, the redirect URI is
      `https://abcdwxyz.supabase.co/auth/v1/callback`.

    - Click **Create**.
    - A popup shows your **Client ID** and **Client secret**. Copy both into
      a notepad (you'll need them in the next step).

5. **Tell Supabase to use Google:**
    - Sign in to https://supabase.com → your project → **Authentication** →
      **Providers** → **Google**.
    - Toggle **Enable Sign in with Google** ON.
    - Paste the **Client ID** into the "Client ID" field.
    - Paste the **Client secret** into the "Client Secret" field.
    - Click **Save**.

6. **Test it:** open your website's `/login` page → click "Continue with
   Google" → it should pop open a Google sign-in window asking you to choose
   an account.

7. **Publish your app (so anyone can sign in, not just you):**
    - Back in Google Cloud Console → **APIs & Services** → **OAuth consent
      screen** → click **Publish app** → confirm.
    - Google might ask for verification if you request sensitive scopes — for
      a simple login we don't, so this is usually instant.

---

## Step 3 — Sign in with Facebook

**Goal:** The **"Continue with Facebook"** button on the login page works.

Time: **~10 minutes**. Free.

1. **Open Facebook Developers** at https://developers.facebook.com → sign in
   with the personal Facebook account that owns the
   `facebook.com/redbarnwesternmarket` page.

2. The first time, Facebook asks "**Are you a developer?**" → click **Get
   Started** → agree to terms → confirm your phone number / email.

3. **Create an App:**
    - Top right → **My Apps** → **Create App**.
    - **Use case:** choose **Authenticate and request data from users with
      Facebook Login**.
    - **Type:** choose **Consumer** (or whatever Facebook offers, since they
      change the wording). Click **Next**.
    - **App name:** `Red Barn Western Market`
    - **Contact email:** `redbarnwesternmarket@gmail.com`
    - (Optional) Link the app to your business if Facebook prompts.
    - Click **Create App** → solve the captcha.

4. **Add Facebook Login to the app:**
    - On the app dashboard, find the tile labeled **Facebook Login** → click
      **Set up**.
    - Choose **Web** when asked which platform.
    - **Site URL:** `https://redbarnwesternmarket.com` (or your final URL —
      can edit later). Click **Save** → **Continue** through the next pages
      (the auto-quickstart code is for developers; you can ignore it).

5. **Add the redirect URL Supabase will use:**
    - Left sidebar (inside your app) → **Facebook Login** → **Settings**.
    - Find the field **"Valid OAuth Redirect URIs"** and paste this exactly:

      ```
      https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
      ```

      (Same as Google — replace `YOUR-PROJECT-ID` with your Supabase
      project's subdomain.)
    - Click **Save Changes** at the bottom.

6. **Copy your App ID + App Secret:**
    - Left sidebar → **Settings** → **Basic**.
    - **App ID** is shown at the top of the page — copy it.
    - **App secret** → click **Show** → enter your Facebook password if
      prompted → copy the secret.

7. **Tell Supabase to use Facebook:**
    - Supabase → **Authentication** → **Providers** → **Facebook**.
    - Toggle **Enabled** ON.
    - Paste the **App ID** into "Facebook client ID".
    - Paste the **App secret** into "Facebook secret".
    - Click **Save**.

8. **Switch the Facebook app to "Live" mode** (so non-developers can sign in):
    - Top of the Facebook Developers page → flip the **"App Mode"** switch
      from **Development** to **Live**.
    - Facebook may ask you to add a Privacy Policy URL and a category. Use:
      - Category: `Shopping & Retail`
      - Privacy Policy URL: `https://redbarnwesternmarket.com/privacy`
        (point this at any privacy policy page on your future site)

9. **Test it:** open your website's `/login` page → click "Continue with
   Facebook" → it should open the Facebook permission screen.

---

## Step 4 — Stripe (taking real payments)

**Goal:** The **Checkout** button creates a real Stripe payment session.
Customers' payments land in your bank account.

Time: **~15 minutes**. Free to set up. Stripe takes ~2.9% + $0.30 per
transaction — there are no monthly fees.

> ⚠️ **Important order of operations:** First connect Stripe in **test
> mode** so we can verify everything works. Once test mode works, switch to
> **live mode** to take real money.

### 4A — Sign up for Stripe (test mode)

1. **Open** https://dashboard.stripe.com/register.

2. Fill in:
    - Email: `redbarnwesternmarket@gmail.com`
    - Full name: *your* legal name (the business owner's name)
    - Country: **United States**
    - Password: choose a strong one
    - Click **Create account**.

3. Stripe emails you a verification link. Click it.

4. You're now in the Stripe dashboard. In the **top-left** there is a toggle
   that says **"Test mode"** — leave it ON for now.

5. **Copy your test API keys:**
    - Left sidebar → **Developers** → **API keys**.
    - You'll see two keys:
      - **Publishable key** — starts with `pk_test_…`
      - **Secret key** — starts with `sk_test_…` (you have to click "Reveal"
        to see it)
    - Copy both into a notepad. **The secret key is sensitive — treat it
      like a password.**

6. **Hand these to your developer / paste into Netlify** (see [Where to
   paste your keys](#where-to-paste-your-keys) at the bottom):
    - `STRIPE_SECRET_KEY` = the `sk_test_…` value (for now)

7. **Test the checkout button:**
    - Open the website → add anything to cart → click **Checkout**.
    - You should be redirected to a real Stripe payment page.
    - Use test card **`4242 4242 4242 4242`**, any future expiry (e.g.
      `12/30`), any 3-digit CVC (e.g. `123`), any ZIP (e.g. `74066`).
    - The payment "succeeds" and you're sent back to the website's success
      page. **No real money moved** because you're in test mode.

If the above works, you've proven everything is wired correctly. Now switch
to live mode.

### 4B — Activate Stripe (live mode = real money)

1. **Stripe dashboard** → top-left → flip the **"Test mode"** toggle OFF
   (it'll turn to "Live mode" — the dashboard turns from orange to white).

2. Stripe will prompt you to **"Activate payments"** — fill in:
    - **Business type:** Sole proprietorship / LLC / Corporation — pick what
      Red Barn is registered as.
    - **Legal name** of the business (as it appears on your tax docs).
    - **EIN** (if Red Barn is an LLC / Corp) or **SSN** (if sole proprietor).
      Stripe uses this for tax reporting — they don't share it publicly.
    - **Business address** = `308 S. 209th W. Ave., Sand Springs, OK 74066`.
    - **Phone:** `+1 (918) 245-8112`.
    - **Website:** your future site URL.
    - **Bank account:** routing number + account number for the bank
      account where you want payouts deposited. (Stripe pays out every 2
      business days by default — you can change to weekly / monthly later.)
    - **Statement descriptor:** `RED BARN WM` (this is what shows up on
      your customers' credit-card statements — keep it short, all caps,
      max 22 chars).

3. Click **Submit**. Stripe usually verifies within minutes for US sole
   proprietors. You'll see a green "Payments enabled" badge.

4. **Copy your LIVE API keys:**
    - Left sidebar → **Developers** → **API keys** (make sure the top-left
      says "Live mode" now).
    - Copy the new live **Secret key** — starts with `sk_live_…`.

5. **Replace `sk_test_…` with `sk_live_…`** in Netlify (see [Where to paste
   your keys](#where-to-paste-your-keys)). Save. The website will now
   process **real** payments.

6. **Choose which payment methods you accept:**
    - Stripe dashboard → **Settings** → **Payment methods**.
    - Enable **Cards**, **Apple Pay**, **Google Pay**, **Link**, and
      anything else you want. They appear automatically on the checkout
      page — no code change needed.

### 4C — Set up the Stripe Webhook (so orders save into the database)

This step is what makes orders show up in your `/admin` dashboard after a
customer pays. **Skip this only if you don't care about seeing orders in the
admin.**

1. Stripe dashboard → **Developers** → **Webhooks** → **+ Add endpoint**.

2. **Endpoint URL:** `https://<your-website>/api/stripe-webhook`
   (e.g. `https://redbarnwesternmarket.com/api/stripe-webhook`).

3. **Events to send:** click **+ Select events** → check **`checkout.session.completed`** → confirm.

4. Click **Add endpoint**.

5. On the new endpoint page, find **"Signing secret"** → click **Reveal** →
   copy the value (starts with `whsec_…`).

6. Add this as another environment variable: `STRIPE_WEBHOOK_SECRET = whsec_…`
   (see [Where to paste your keys](#where-to-paste-your-keys)).

7. Make a real purchase in live mode (or a test purchase in test mode) —
   the order should appear at `/admin/orders`.

> **Tip:** Do steps 1–6 once for **test mode** and **again** for **live
> mode** — they produce different signing secrets. You only need to wire up
> the live one in production.

---

## Where to paste your keys

Every value you copied above becomes an **environment variable** on the
hosting platform (Netlify or Cloudflare Pages — whichever your developer
chose). You only have to do this once.

### If hosted on **Netlify** (most likely)

1. Sign in to https://app.netlify.com → click the Red Barn site.
2. Top tabs → **Site configuration** → left sidebar → **Environment
   variables** → **Add a variable**.
3. For each row in the table below, click **Add a variable → Add a single
   variable**, type the **Key** name exactly as shown, paste the **Value**
   you copied, leave **Scopes** = "All scopes". Click **Create variable**.
4. After adding them all, go to **Deploys** → **Trigger deploy** → **Deploy
   site**. Netlify rebuilds with the new values (~1 minute).

| Key (paste exactly)              | Value (where you got it)                                            |
|----------------------------------|---------------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase → Project Settings → API → "Project URL"                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase → Project Settings → API → "anon public" key               |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase → Project Settings → API → "service_role" key (**secret**) |
| `STRIPE_SECRET_KEY`              | Stripe → Developers → API keys → Secret key (test or live)          |
| `STRIPE_WEBHOOK_SECRET`          | Stripe → Developers → Webhooks → your endpoint → Signing secret     |
| `NEXT_PUBLIC_SITE_URL`           | Your live website URL, e.g. `https://redbarnwesternmarket.com`      |

### If hosted on **Cloudflare Pages**

1. Sign in to https://dash.cloudflare.com → **Workers & Pages** → click the
   site.
2. **Settings** → **Environment variables** → **+ Add variables** (set for
   **Production**).
3. Same Key/Value table as above. Click **Save**.
4. **Deployments** → **…** on the latest deployment → **Retry deployment**.

---

## What if something doesn't work?

- **"Continue with Google" pops up an error like "redirect_uri_mismatch":**
  The redirect URL in Google Cloud Console doesn't exactly match the one
  Supabase expects. Copy the exact URL from Supabase → Authentication →
  Providers → Google → "Callback URL" and make sure it's in
  Google Cloud → Credentials → your OAuth client → "Authorized redirect URIs".

- **Facebook login says "URL is not whitelisted":** Same fix — go to
  Facebook → Facebook Login → Settings → make sure the Supabase callback
  URL is in "Valid OAuth Redirect URIs".

- **Stripe checkout button shows "Stripe is not configured yet":**
  Means `STRIPE_SECRET_KEY` isn't set in Netlify/Cloudflare environment
  variables. Re-check Step 4.

- **Customers' confirmation emails go to spam:** Add an SPF record to the
  domain `redbarnwesternmarket.com`'s DNS pointing to `_spf.google.com`. If
  you don't own the domain yet, ignore this until you do.

If you get stuck on any specific step, paste the error message into your
chat with your developer and they can take it from there.
