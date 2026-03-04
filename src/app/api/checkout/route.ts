import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS, PlanName, BillingInterval } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { plan, interval } = (await req.json()) as {
    plan: string;
    interval: string;
  };

  if (!["explore", "pro"].includes(plan) || !["monthly", "yearly"].includes(interval)) {
    return NextResponse.json({ error: "Invalid plan or interval" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan as PlanName][interval as BillingInterval];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
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
