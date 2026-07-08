import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import Stripe from "stripe";

// Supermarket subscription price ID (€50/month)
// This should be created in your Stripe dashboard first
const SUPERMARKET_PRICE_ID = process.env.STRIPE_SUPERMARKET_PRICE_ID || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the supermarket profile
    const { data: supermarket, error: supermarketError } = await sb
      .from("profiles")
      .select("id, email, stripe_customer_id, subscription_status")
      .eq("id", supermarketId)
      .eq("is_supermarket", true)
      .single();

    if (supermarketError || !supermarket) {
      return NextResponse.json(
        { error: "Supermarket not found" },
        { status: 404 }
      );
    }

    // Get the user making the request (must be the supermarket owner or admin)
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user || (user as any).id !== (supermarket as any).id) {
      return NextResponse.json(
        { error: "Unauthorized - only the supermarket owner can manage subscriptions" },
        { status: 403 }
      );
    }

    // Check if already has a subscription
    if (supermarket.subscription_status === "active") {
      return NextResponse.json(
        { error: "Supermarket already has an active subscription" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    let stripeCustomerId = supermarket.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: supermarket.email,
        metadata: {
          supermarket_id: supermarketId,
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update supermarket with Stripe customer ID
      const { error: updateError } = await sb
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", supermarketId);

      if (updateError) {
        console.error("Error updating Stripe customer ID:", updateError);
        // Continue anyway, we can update it later
      }
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: SUPERMARKET_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/admin/supermarkets/${supermarketId}?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/admin/supermarkets/${supermarketId}?subscription=canceled`,
      metadata: {
        supermarket_id: supermarketId,
        user_id: user.id,
        action: "subscribe",
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the supermarket profile
    const { data: supermarket, error: supermarketError } = await sb
      .from("profiles")
      .select("id, email, stripe_customer_id, stripe_subscription_id, subscription_status")
      .eq("id", supermarketId)
      .eq("is_supermarket", true)
      .single();

    if (supermarketError || !supermarket) {
      return NextResponse.json(
        { error: "Supermarket not found" },
        { status: 404 }
      );
    }

    // Get the user making the request (must be the supermarket owner or admin)
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user || (user as any).id !== (supermarket as any).id) {
      return NextResponse.json(
        { error: "Unauthorized - only the supermarket owner can manage subscriptions" },
        { status: 403 }
      );
    }

    if (!(supermarket as any).stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.cancel((supermarket as any).stripe_subscription_id);

    // Update supermarket subscription status
    const { error: updateError } = await sb
      .from("profiles")
      .update({
        subscription_status: "canceled",
        subscription_end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
      })
      .eq("id", supermarketId);

    if (updateError) {
      console.error("Error updating subscription status:", updateError);
      // Continue anyway, the Stripe subscription is already canceled
    }

    return NextResponse.json({
      message: "Subscription canceled successfully",
      cancelationDate: new Date((subscription as any).canceled_at * 1000).toISOString(),
      effectiveDate: new Date((subscription as any).current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supermarketId } = await params;
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the supermarket profile
    const { data: supermarket, error: supermarketError } = await sb
      .from("profiles")
      .select(
        "id, email, stripe_customer_id, stripe_subscription_id, subscription_status, " +
        "subscription_start_date, subscription_end_date"
      )
      .eq("id", supermarketId)
      .eq("is_supermarket", true)
      .single();

    if (supermarketError || !supermarket) {
      return NextResponse.json(
        { error: "Supermarket not found" },
        { status: 404 }
      );
    }

    // Get the user making the request (must be the supermarket owner or admin)
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user || (user as any).id !== (supermarket as any).id) {
      return NextResponse.json(
        { error: "Unauthorized - only the supermarket owner can view subscriptions" },
        { status: 403 }
      );
    }

    let subscriptionData = null;
    const stripe = getStripeClient();
    
    if (stripe && (supermarket as any).stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve((supermarket as any).stripe_subscription_id);
        subscriptionData = {
          id: subscription.id,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start * 1000,
          current_period_end: (subscription as any).current_period_end * 1000,
          cancel_at_period_end: (subscription as any).cancel_at_period_end,
          canceled_at: (subscription as any).canceled_at ? (subscription as any).canceled_at * 1000 : null,
        };
      } catch (err) {
        console.error("Error fetching subscription from Stripe:", err);
      }
    }

    return NextResponse.json({
      supermarket_id: (supermarket as any).id,
      subscription_status: (supermarket as any).subscription_status,
      stripe_customer_id: (supermarket as any).stripe_customer_id,
      stripe_subscription_id: (supermarket as any).stripe_subscription_id,
      subscription_start_date: (supermarket as any).subscription_start_date,
      subscription_end_date: (supermarket as any).subscription_end_date,
      stripe_data: subscriptionData,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
