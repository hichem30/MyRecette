# How to turn on KV-backed page caching (non-technical, ~5 min)

This is optional but recommended once your client launches. KV stores
the rendered storefront pages in Cloudflare's global edge — every
cached page-view costs ~0ms of worker CPU instead of ~5-10ms, which is
what keeps you safely under the free-plan 10ms ceiling at high traffic.

Without it the site still works, the worker just re-renders each page
on cache misses. Fine for moderate traffic, less ideal at scale.

You **never have to touch a terminal** for this. Everything is dashboard +
GitHub web UI.

---

## Step 1 — Create the KV namespace in Cloudflare (1 min)

1. Open https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces
2. Click the big blue **"Create a namespace"** button.
3. **Namespace name** → type exactly:
   ```
   NEXT_INC_CACHE_KV
   ```
   (capital letters, with underscores — must match exactly)
4. Click **"Add"** or **"Create namespace"**.
5. You'll land on a page listing all your namespaces. Find the row that
   says `NEXT_INC_CACHE_KV`. Next to the name is a long string of
   letters and numbers (looks like `a1b2c3d4e5f6...`). That's the **ID**.
6. Click on it to copy it, or right-click → Copy. Keep it handy for
   step 2.

---

## Step 2 — Paste the ID into wrangler.jsonc on GitHub (2 min)

1. Open this link in your browser:
   https://github.com/HichemJouili1996/Red-Barn/edit/devin/1778689863-rb-build/wrangler.jsonc
2. You're now in GitHub's web editor for `wrangler.jsonc`.
3. Scroll to the bottom. You'll see a commented block like this:
   ```jsonc
     // To enable the OpenNext ISR cache on Cloudflare KV ...
     //   npx wrangler kv namespace create NEXT_INC_CACHE_KV
     // ,"kv_namespaces": [
     //   { "binding": "NEXT_INC_CACHE_KV", "id": "<paste-id-here>" }
     // ]
   ```
4. **Delete those last three `//` lines** and replace them with this
   (paste your real ID in place of `<paste-id-here>`):
   ```jsonc
     ,"kv_namespaces": [
       { "binding": "NEXT_INC_CACHE_KV", "id": "<paste-id-here>" }
     ]
   ```
   So the comma at the start of `,"kv_namespaces"` matches the JSON
   property above it. (Don't worry — if the syntax is wrong, Cloudflare's
   build will tell you and you can fix the typo right back in the same
   editor.)
5. Scroll down → fill in the **"Commit changes"** box → type something
   like `enable KV ISR cache`.
6. Click the green **"Commit changes"** button.

---

## Step 3 — Tell me you've done it (10 sec)

Drop me a message saying "KV is set up". I'll push **one tiny commit**
that flips the two `// KV:` lines in `open-next.config.ts` to wire KV in,
Cloudflare auto-deploys, and from that moment on every cached storefront
page returns from KV with ~0ms worker CPU.

That's it. Total time: under 5 minutes, no terminal, no code.

---

## What does this give you, exactly?

| Without KV (current) | With KV |
|---|---|
| Each page-view re-renders Next.js | Pages cached in Cloudflare's global KV for 60s |
| Worker CPU per page: ~5-10ms | Worker CPU per page: ~0ms |
| 1102 risk at high traffic | Effectively unlimited free-plan headroom |
| Slightly slower TTFB on cold isolates | Sub-50ms TTFB from nearest edge |

KV is what Cloudflare itself recommends for OpenNext production. Free
up to 100k reads/day. Beyond that it's $0.50 per million reads — for
context, 50k daily visitors costs ~$0.10/month total. Real e-commerce
scale on the free or near-free tier indefinitely.

---

## Worried about breaking something?

Nothing about the live site changes until step 3, when I push the
commit that enables it. If anything goes wrong, reverting that one
commit (single button on the GitHub PR) restores the current behaviour
instantly.
