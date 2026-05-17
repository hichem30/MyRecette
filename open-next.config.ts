import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * KV-backed incremental cache is the recommended long-term setup on
 * Cloudflare Workers (free up to 100k reads/day, ~$0.50/M reads after
 * that — peanuts even at thousands of customers). It lets ISR pages
 * serve from a global KV store with ~0ms worker CPU per cached hit,
 * keeping the free plan's 10ms CPU budget safe forever.
 *
 * To turn it on (one-time, dashboard-only — see KV_SETUP.md):
 *   1. Create the namespace in the Cloudflare dashboard.
 *   2. Paste the resulting namespace id into the `kv_namespaces`
 *      block in wrangler.jsonc.
 *   3. Uncomment the two `// KV:` lines below and redeploy.
 *
 * We default to no incremental cache so deploys never fail because of
 * a missing KV binding — the storefront ISR-renders per request, which
 * is fine for the current traffic level and only becomes a CPU concern
 * once you're seeing real production load.
 */
// KV: import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

export default defineCloudflareConfig({
  // KV: incrementalCache: kvIncrementalCache,
});
