import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import dummyIncrementalCache from "@opennextjs/aws/overrides/incrementalCache/dummy.js";

/**
 * Incremental cache override.
 *
 * Previously used `kvIncrementalCache` which writes all ISR pages to
 * Cloudflare KV on every deploy (~115 keys per deploy). The free plan
 * caps KV bulk writes at 1k/day, so multiple deploys per day eventually
 * fail with code 10048 ("free usage limit for this operation for today").
 *
 * Switched to the no-op `dummyIncrementalCache` so the deploy never
 * touches KV. Pages render on demand (still fast — sub-100ms — at this
 * traffic level). When upgrading to the Workers Paid plan ($5/mo, no
 * KV write cap), swap this back to `kvIncrementalCache` from
 * `@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache`
 * and add the `kv_namespaces` binding back to wrangler.jsonc.
 */
export default defineCloudflareConfig({
  incrementalCache: dummyIncrementalCache,
});
