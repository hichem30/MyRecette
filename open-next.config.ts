import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

/**
 * KV-backed incremental cache. ISR pages serve from Cloudflare's global
 * KV store with ~0ms worker CPU per cached hit, which keeps the free
 * plan's 10ms per-request budget safe at any traffic level.
 *
 * Free tier is 100k reads + 1k writes / day. Beyond that it's $0.50
 * per million reads — a busy storefront with 50k daily visitors costs
 * roughly $0.10 / month.
 *
 * Binding is set up via wrangler.jsonc (kv_namespaces) and the matching
 * KV namespace must exist in the Cloudflare dashboard. See KV_SETUP.md.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
