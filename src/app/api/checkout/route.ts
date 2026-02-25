import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS, PlanName, BillingInterval } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, interval } = (await req.json()) as {
    plan: string;
    interval: string;
  };

  if (!["explore", "pro"].includes(plan) || !["monthly", "yearly"].includes(interval)) {
    return NextResponse.json({ error: "Invalid plan or interval" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan as PlanName][interval as BillingInterval];

  // Reuse existing Stripe customer if we already have one
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/dashboard?checkout=success`,
    cancel_url: `${req.nextUrl.origin}/pricing`,
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan, interval },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
