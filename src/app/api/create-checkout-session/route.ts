import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/server";

interface LineInput {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export async function POST(req: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY (sk_test_... for testing, sk_live_... for real payments) to your .env.local file. See README.md for the full Stripe setup guide.",
      },
      { status: 503 },
    );
  }

  try {
    const { items, locale }: { items: LineInput[]; locale: "en" | "es" } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "usd",
          product_data: {
            name: i.name,
            images: i.image_url ? [i.image_url] : undefined,
            metadata: { product_id: i.product_id },
          },
          unit_amount: Math.round(i.price * 100),
        },
      })),
      automatic_tax: { enabled: false },
      shipping_address_collection: { allowed_countries: ["US", "CA", "MX"] },
      allow_promotion_codes: true,
      locale: locale === "es" ? "es" : "en",
      success_url: `${origin}/${locale}/checkout/success?email={CHECKOUT_SESSION_CUSTOMER_EMAIL}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout/cancel`,
      metadata: { source: "redbarn-storefront" },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
