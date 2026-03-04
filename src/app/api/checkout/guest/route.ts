import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_IDS, PlanName, BillingInterval } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { plan, interval } = (await req.json()) as {
    plan: string;
    interval: string;
  };

  if (
    !["explore", "pro"].includes(plan) ||
    !["monthly", "yearly"].includes(interval)
  ) {
    return NextResponse.json(
      { error: "Invalid plan or interval" },
      { status: 400 }
    );
  }

  const priceId = PRICE_IDS[plan as PlanName][interval as BillingInterval];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.nextUrl.origin}/pricing`,
    subscription_data: {
      metadata: { plan, interval },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
