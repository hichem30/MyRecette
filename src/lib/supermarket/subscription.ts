/**
 * Supermarket Subscription Utilities
 * Handles subscription checks and feature gating for supermarkets
 */

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Check if a supermarket has an active subscription
 */
export async function checkSupermarketSubscription(supermarketId: string): Promise<{
  hasActiveSubscription: boolean;
  subscription?: any;
  error?: string;
}> {
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // For local development, return true to allow all features
    return {
      hasActiveSubscription: true,
      subscription: {
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      },
    };
  }

  try {
    // First check the profile subscription status
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("subscription_status, subscription_end_date, stripe_customer_id")
      .eq("id", supermarketId)
      .eq("is_supermarket", true)
      .single();

    if (profileError || !profile) {
      return {
        hasActiveSubscription: false,
        error: "Supermarket not found",
      };
    }

    // Check if subscription is active
    const isActive = profile.subscription_status === "active";
    
    // If not active by status, check the end date
    const now = new Date();
    const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
    
    if (isActive && endDate && endDate > now) {
      return {
        hasActiveSubscription: true,
        subscription: { status: profile.subscription_status, endDate: profile.subscription_end_date },
      };
    }

    // Check the subscriptions table for more details
    if (profile.stripe_customer_id) {
      const { data: subscription, error: subError } = await sb
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("stripe_customer_id", profile.stripe_customer_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!subError && subscription) {
        const subEndDate = new Date(subscription.current_period_end);
        const subIsActive = subscription.status === "active" && subEndDate > now;
        
        if (subIsActive) {
          return {
            hasActiveSubscription: true,
            subscription: {
              status: subscription.status,
              endDate: subscription.current_period_end,
            },
          };
        }
      }
    }

    // Subscription is not active
    return {
      hasActiveSubscription: false,
      subscription: { status: profile.subscription_status, endDate: profile.subscription_end_date },
    };

  } catch (error) {
    console.error("Error checking subscription:", error);
    return {
      hasActiveSubscription: false,
      error: "Failed to check subscription status",
    };
  }
}

/**
 * List of features that require an active subscription
 */
export const SUBSCRIPTION_REQUIRED_FEATURES = [
  "upload_inventory",      // CSV bulk upload
  "manage_products",       // Add/edit/remove products
  "create_coupons",        // Create and manage coupons
  "create_bundles",        // Create and manage bundles
  "create_sales",          // Create and manage sales
  "create_jobs",           // Create and manage job listings
  "advanced_analytics",    // Access to detailed analytics
  "custom_branding",       // Custom branding options
  "priority_support",      // Priority customer support
];

/**
 * Features that are always available (even without subscription)
 */
export const FREE_FEATURES = [
  "view_profile",          // View own supermarket profile
  "basic_products",       // View basic product info (no management)
  "follow_users",         // Users can follow supermarket
  "basic_listing",        // Basic listing in search results
];

/**
 * Check if a specific feature requires an active subscription
 */
export function isFeatureSubscriptionRequired(feature: string): boolean {
  return SUBSCRIPTION_REQUIRED_FEATURES.includes(feature);
}

/**
 * Check if a supermarket can access a specific feature
 */
export async function canAccessFeature(
  supermarketId: string,
  feature: string
): Promise<{
  allowed: boolean;
  requiresSubscription: boolean;
  subscriptionActive: boolean;
  error?: string;
}> {
  const requiresSubscription = isFeatureSubscriptionRequired(feature);
  
  // Free features are always allowed
  if (!requiresSubscription) {
    return {
      allowed: true,
      requiresSubscription: false,
      subscriptionActive: false,
    };
  }

  // Check subscription status
  const subscriptionCheck = await checkSupermarketSubscription(supermarketId);
  
  if (subscriptionCheck.error) {
    return {
      allowed: false,
      requiresSubscription: true,
      subscriptionActive: false,
      error: subscriptionCheck.error,
    };
  }

  return {
    allowed: subscriptionCheck.hasActiveSubscription,
    requiresSubscription: true,
    subscriptionActive: subscriptionCheck.hasActiveSubscription,
  };
}

/**
 * Get subscription status for middleware
 */
export async function getSubscriptionStatusForMiddleware(userId: string): Promise<{
  isSupermarket: boolean;
  supermarketId?: string;
  hasActiveSubscription: boolean;
  error?: string;
}> {
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // For local development, allow all features
    return {
      isSupermarket: true,
      supermarketId: userId,
      hasActiveSubscription: true,
    };
  }

  try {
    // Check if user is a supermarket
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("id, is_supermarket, subscription_status, subscription_end_date, stripe_customer_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        isSupermarket: false,
        error: "User not found",
      };
    }

    if (!profile.is_supermarket) {
      return {
        isSupermarket: false,
        error: "User is not a supermarket",
      };
    }

    // Check subscription status
    const subscriptionCheck = await checkSupermarketSubscription(profile.id);
    
    return {
      isSupermarket: true,
      supermarketId: profile.id,
      hasActiveSubscription: subscriptionCheck.hasActiveSubscription,
      error: subscriptionCheck.error,
    };

  } catch (error) {
    console.error("Error in getSubscriptionStatusForMiddleware:", error);
    return {
      isSupermarket: false,
      error: "Failed to check subscription status",
    };
  }
}