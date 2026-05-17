import Stripe from "stripe";

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("sk_test_..."),
  );
}

let cached: Stripe | null = null;

/**
 * Stripe SDK configured to run in Cloudflare Workers (no Node `https`,
 * uses fetch + Web Crypto). Falls back to defaults outside the worker
 * runtime so local Node dev keeps working.
 */
export function getStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (cached) return cached;
  cached = new Stripe(process.env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  return cached;
}
