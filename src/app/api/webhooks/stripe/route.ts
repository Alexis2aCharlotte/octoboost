import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyTelegram } from "@/lib/services/telegram";
import { sendUpgradeEmail } from "@/lib/services/email";
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
      if (!userId) {
        // Guest checkout — account linking happens in /api/auth/create-account
        const guestPlan = subscription.metadata.plan ?? "explore";
        const guestInterval = subscription.metadata.interval ?? "monthly";
        const guestAmount = session.amount_total
          ? `$${(session.amount_total / 100).toFixed(0)}`
          : "—";
        const guestLabel = guestPlan.charAt(0).toUpperCase() + guestPlan.slice(1);
        notifyTelegram(`💳 ${guestLabel} ${guestInterval} — ${guestAmount}\nAccount pending ⏳`).catch(() => {});
        break;
      }

      const item = subscription.items.data[0];
      const periodStart = item?.current_period_start;
      const periodEnd = item?.current_period_end;

      await supabase.from("profiles").upsert(
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

      const planRaw = subscription.metadata.plan ?? "explore";
      const planLabel = planRaw.charAt(0).toUpperCase() + planRaw.slice(1);
      const intervalRaw = subscription.metadata.interval ?? "monthly";
      const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(0)}` : "—";

      const customerEmail = session.customer_details?.email ?? session.customer_email;
      if (customerEmail) {
        sendUpgradeEmail(customerEmail, planRaw, intervalRaw, amount).catch((err) =>
          console.error("Failed to send upgrade email:", err)
        );
      }

      notifyTelegram(`💳 ${planLabel} ${intervalRaw} — ${amount}\nConfirmation email sent ✅`).catch(() => {});
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
        .from("profiles")
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
        .from("profiles")
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
        .from("profiles")
        .update({ status: "past_due" })
        .eq("user_id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
