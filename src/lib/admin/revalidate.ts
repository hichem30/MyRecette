// Called from admin client pages after a successful save/update.
// Purges the catalog ISR cache for the affected scope so customer-facing
// pages refresh immediately instead of waiting for the 1-hour revalidate.
// Failures are non-fatal: if the request errors, the ISR window still
// eventually picks up the change.
export async function revalidateAdmin(
  scope: "products" | "categories" | "bundles" | "promos" | "delivery",
  slug?: string | null,
): Promise<void> {
  try {
    await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, slug }),
    });
  } catch {
    // Silently ignore — ISR will eventually pick it up.
  }
}
