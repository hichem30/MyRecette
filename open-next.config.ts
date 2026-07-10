import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import dummyIncrementalCache from "@opennextjs/aws/overrides/incrementalCache/dummy.js";

/**
 * Incremental cache override.
 *
 * Previously used `kvIncrementalCache` which writes all ISR pages to
 * Cloudflare KV on every deploy (~115 keys per deploy). The free plan
 * caps KV bulk writes at 1k/day and a single deploy uploads ~115
 * keys, so several deploys per day fail with code 10048. open-next.config
 * now uses `dummyIncrementalCache` instead — pages render on demand
 * without any KV writes.
 */
export default defineCloudflareConfig({
  incrementalCache: dummyIncrementalCache,
});
