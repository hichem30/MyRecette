/**
 * Subscription Gating Middleware
 * Protects supermarket features that require an active subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSubscriptionStatusForMiddleware } from "@/lib/supermarket/subscription";

/**
 * List of admin routes that require an active subscription
 */
const SUBSCRIPTION_REQUIRED_ADMIN_ROUTES = [
  "/admin/products/bulk-upload",
  "/admin/products/new",
  "/admin/products/[id]/edit",
  "/admin/coupons",
  "/admin/coupons/new",
  "/admin/coupons/[id]/edit",
  "/admin/bundles",
  "/admin/bundles/new",
  "/admin/bundles/[id]/edit",
  "/admin/promos",
  "/admin/promos/new",
  "/admin/promos/[id]/edit",
  "/admin/jobs",
  "/admin/jobs/new",
  "/admin/jobs/[id]/edit",
];

/**
 * List of API routes that require an active subscription
 */
const SUBSCRIPTION_REQUIRED_API_ROUTES = [
  "/api/admin/supermarket/bulk-upload",
  "/api/admin/products",
  "/api/admin/coupons",
  "/api/admin/bundles",
  "/api/admin/promos",
  "/api/admin/jobs",
];

/**
 * Check if a route requires an active subscription
 */
function requiresSubscription(pathname: string): boolean {
  // Check admin routes
  for (const route of SUBSCRIPTION_REQUIRED_ADMIN_ROUTES) {
    if (pathname.startsWith(route.replace(/\\[id\\]/g, ""))) {
      return true;
    }
  }

  // Check API routes
  for (const route of SUBSCRIPTION_REQUIRED_API_ROUTES) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract supermarket ID from request
 * This could be from session, cookies, or path parameters
 */
async function getSupermarketIdFromRequest(request: NextRequest): string | null {
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // For local development, return a mock ID
    return "mock_supermarket_123";
  }

  try {
    // Get user from session
    const { data: { user }, error: userError } = await sb.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    // Check if user is a supermarket
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("id, is_supermarket")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.is_supermarket) {
      return null;
    }

    return profile.id;

  } catch (error) {
    console.error("Error getting supermarket ID from request:", error);
    return null;
  }
}

/**
 * Subscription gating middleware
 */
export async function subscriptionGateMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip if not a protected route
  if (!requiresSubscription(pathname)) {
    return null; // Allow the request to proceed
  }

  // Get supermarket ID
  const supermarketId = await getSupermarketIdFromRequest(request);

  if (!supermarketId) {
    // User is not a supermarket, redirect to login or access denied
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("subscription_error", "not_supermarket", { maxAge: 60 });
    return response;
  }

  // Check subscription status
  const subscriptionStatus = await getSubscriptionStatusForMiddleware(supermarketId);

  if (!subscriptionStatus.hasActiveSubscription) {
    // Redirect to subscription page
    const subscribeUrl = new URL("/supermarket/subscribe", request.url);
    const response = NextResponse.redirect(subscribeUrl);
    response.cookies.set("subscription_error", "inactive_subscription", { maxAge: 60 });
    response.cookies.set("redirect_after_subscribe", pathname, { maxAge: 300 });
    return response;
  }

  // Subscription is active, allow the request to proceed
  return null;
}

/**
 * API-specific subscription middleware
 * Returns a JSON response for API routes
 */
export async function subscriptionGateApiMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Check if this is a subscription-required API route
  for (const route of SUBSCRIPTION_REQUIRED_API_ROUTES) {
    if (pathname.startsWith(route)) {
      const supermarketId = await getSupermarketIdFromRequest(request);

      if (!supermarketId) {
        return NextResponse.json(
          { error: "Authentication required", requiresSubscription: true },
          { status: 401 }
        );
      }

      const subscriptionStatus = await getSubscriptionStatusForMiddleware(supermarketId);

      if (!subscriptionStatus.hasActiveSubscription) {
        return NextResponse.json(
          {
            error: "Subscription required",
            message: "This feature requires an active €50/month subscription",
            requiresSubscription: true,
            subscribeUrl: "/supermarket/subscribe",
          },
          { status: 402 } // Payment Required
        );
      }

      return null; // Allow the request
    }
  }

  return null; // Not a protected API route
}

/**
 * Create subscription-gated response helpers for server components
 */
export function createSubscriptionGate<Props extends object>({
  feature,
  redirectTo = "/supermarket/subscribe",
}: {
  feature: string;
  redirectTo?: string;
}) {
  return async (props: Props) => {
    // This would be used in server components to check subscription status
    // Implementation would check the current user and their subscription
    return null; // Placeholder
  };
}