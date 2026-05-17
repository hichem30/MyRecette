import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

/**
 * Cloudflare Workers free plan limits each request to 10ms CPU. Without a
 * persistent ISR backend OpenNext re-renders every page on every request
 * which trivially blows that budget on cold isolates.
 *
 * KV is free up to 100k reads/day & 1k writes/day, plenty for a storefront
 * with ISR=60s. Pages are served from KV until the revalidate window
 * elapses, after which one request triggers a re-build and the next ~99
 * requests are served from KV again with ~0ms worker CPU.
 *
 * Provision the namespace once with:
 *   npx wrangler kv namespace create NEXT_INC_CACHE_KV
 * then paste the returned id into wrangler.jsonc under kv_namespaces.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
