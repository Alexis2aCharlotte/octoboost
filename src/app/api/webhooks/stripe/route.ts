import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const item = subscription.items.data[0];
      const periodStart = item?.current_period_start;
      const periodEnd = item?.current_period_end;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan: subscription.metadata.plan ?? "explore",
          interval: subscription.metadata.interval ?? "monthly",
          status: subscription.status,
          ...(periodStart && { current_period_start: new Date(periodStart * 1000).toISOString() }),
          ...(periodEnd && { current_period_end: new Date(periodEnd * 1000).toISOString() }),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const item = subscription.items.data[0];
      const periodStart = item?.current_period_start;
      const periodEnd = item?.current_period_end;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          plan: subscription.metadata.plan ?? undefined,
          interval: subscription.metadata.interval ?? undefined,
          ...(periodStart && { current_period_start: new Date(periodStart * 1000).toISOString() }),
          ...(periodEnd && { current_period_end: new Date(periodEnd * 1000).toISOString() }),
        })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", userId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceSub = invoice.parent?.subscription_details?.subscription;
      if (!invoiceSub) break;

      const subId = typeof invoiceSub === "string" ? invoiceSub : invoiceSub.id;
      const subscription = await stripe.subscriptions.retrieve(subId);
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
